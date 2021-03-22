/**
 * Deno implementation of low level Postgresql frontend-backend protocol
 * https://www.postgresql.org/docs/13/protocol-message-formats.html
 */
import {
    createHash
} from './deps.ts'
import {
    MESSAGE_CODE,
    MESSAGE_NAME,
} from './const.ts'
import {
    BufferReader,
    BufferWriter,
    decode,
    encode,
} from './buffer.ts'
import {
    QUERY_RESULT,
    QueryOptions,
    QueryResult,
    ArrayQueryResult,
    ObjectQueryResult,
} from './cursor.ts'
import {
    // packetReader
    PacketReader,
    AuthenticationReader,
    BackendKeyDataReader,
    BindCompleteReader,
    CloseCompleteReader,
    CommandCompleteReader,
    CopyDataReader,
    CopyDoneReader,
    CopyInResponseReader,
    CopyOutResponseReader,
    CopyBothResponseReader,
    DataRowReader,
    EmptyQueryResponseReader,
    ErrorResponseReader,
    FunctionCallResponseReader,
    NoDataReader,
    NoticeResponseReader,
    NotificationResponseReader,
    ParameterDescriptionReader,
    ParameterStatusReader,
    ParseCompleteReader,
    PortalSuspendedReader,
    ReadyForQueryReader,
    RowDescriptionReader,
    // packetWriter
    PacketWriter,
    BindWriter,
    CancelRequestWriter,
    CloseWriter,
    CopyDataWriter,
    CopyDoneWriter,
    CopyFailWriter,
    DescribeWriter,
    ExecuteWriter,
    FlushWriter,
    FunctionCallWriter,
    GSSResponseWriter,
    ParseWriter,
    PasswordMessageWriter,
    QueryWriter,
    SASLInitialResponseWriter,
    SASLResponseWriter,
    SSLRequestWriter,
    GSSENCRequestWriter,
    StartupWriter,
    SyncWriter,
    TerminateWriter
} from './protocol.ts'




export enum ConnectionState {
    Connecting,
    Connected,
    Closing,
    Closed,
}

export enum TransactionState {
    Idle = 'I',
    IdleInTransaction = "T",
    InFailedTransaction = "E",
}

export interface ConnectionOptions {
    host: string,
    port: number,
    dbname: string,
    user: string,
    password?: string,
    options?: Record<string, string>,
    applicationName: string
}

export class Connection {

    connectionState: ConnectionState = ConnectionState.Connecting
    transactionState?: TransactionState
    // deno-lint-ignore no-explicit-any
    serverInfo?: Record<string, any> = {}

    conn?: Deno.Conn = undefined

    constructor(public readonly options: ConnectionOptions) {}

    async connect(): Promise<void> {
        const {
            host,
            port,
        } = this.options
        // tcp connect
        this.conn = await Deno.connect({
            transport: 'tcp',
            hostname: host,
            port: port
        })
        // unix socket connect
        // this.conn = await Deno.connect({
        //     transport: 'unix', // unixSocket
        //     path: host
        // // deno-lint-ignore no-explicit-any
        // } as any)

        // startup writer
        this.writePacket(this.startup())
        // authentication reader/writer
        this.authenticate()

        // connection
        backtrace:
        while (true) {
            const readPacket = await this.readPacket()
            // error
            if (readPacket.name === MESSAGE_NAME.ErrorResponse) {
                throw new Error(`error occured: ${readPacket.message}`)

            } else if (readPacket.name === MESSAGE_NAME.BackendKeyData) {
                Object.assign(this.serverInfo, {
                    processId: readPacket.processId,
                    secretKey: readPacket.secretKey
                })
                break
            
            } else if (readPacket.name === MESSAGE_NAME.ParameterStatus) {
                const parameter = readPacket.parameter
                const value = readPacket.value
                if (this.serverInfo && 'parameters' in this.serverInfo) {
                    this.serverInfo.parameters[parameter] = value
                } else {
                    this.serverInfo!.parameters = {}
                    this.serverInfo!.parameters[parameter] = value
                }
                break

            } else if (readPacket.name === MESSAGE_NAME.ReadyForQuery) {
                this.transactionState = String.fromCharCode(
                    readPacket.status
                ) as TransactionState
                // break label
                break backtrace
            }

            this.connectionState = ConnectionState.Connected
        }
    }

    async close(): Promise<void> {
        if (this.connectionState !== ConnectionState.Closed) {
            // Terminate Message sended before closed
            const terminateWriter = new TerminateWriter()
            const terminateBuffer = new BufferWriter(new Uint8Array(5))
            await this.writePacket(terminateWriter.write(terminateBuffer))
            // socket closed
            this.conn!.close()
            this.connectionState = ConnectionState.Closed
        }
    }

    async execute(options: QueryOptions, result: QUERY_RESULT): Promise<QueryResult> {
        if (this.connectionState !== ConnectionState.Connected) {
            throw new Error(`connection initial before execute`)
        }
        try {
            if (options.parameters!.length === 0) {
                return await this.simpleQuery(options, result)
            } else {
                return await this.extendedQuery(options, result)
            }
        } catch (error) {
            throw new Error(error.message)
        }
    }

    private async simpleQuery(
        options: QueryOptions, 
        queryResult: QUERY_RESULT
    ): Promise<QueryResult> {
        // build query writer
        const queryWriter = new QueryWriter(options.statement)
        const queryBuffer = new BufferWriter(new Uint8Array(options.statement.length + 6))
        await this.writePacket(queryWriter.write(queryBuffer))
        // initial result
        let result: QueryResult
        switch (queryResult) {
            case QUERY_RESULT.ARRAY:
                result = new ArrayQueryResult(options)
                break
            case QUERY_RESULT.OBJECT:
                result = new ObjectQueryResult(options)
                break
        }
        // readPacket, when query startup, return once
        let readPacket = await this.readPacket()
        if (readPacket.name === MESSAGE_NAME.RowDescription) {
            result.description = {
                count: readPacket.count,
                fields: readPacket.fields
            }
        
        } else if (readPacket.name === MESSAGE_NAME.EmptyQueryResponse) {
            // nothing done here
        
        } else if (readPacket.name === MESSAGE_NAME.ErrorResponse) {
            const {
                errcode,
                message
            } = readPacket
            throw new Error(`query error occured: ${errcode} ${message}`)

        } else if (readPacket.name === MESSAGE_NAME.NoticeResponse) {
            result.warnings!.push(readPacket)

        } else if (readPacket.name === MESSAGE_NAME.CommandComplete) {
            const {
                command,
                count
            } = readPacket
            if (command) {
                result.command = command
            }
            if (count) {
                result.count = count
            }

        } else {
            throw new Error(`unexpected query response: ${readPacket.code.toString(16)}`)
        }
        // loop for all rows data
        while (true) {
            readPacket = await this.readPacket()
            if (readPacket.name === MESSAGE_NAME.DataRow) {
                result.insert(readPacket.fields)

            } else if (readPacket.name === MESSAGE_NAME.CommandComplete) {
                const {
                    command,
                    count
                } = readPacket
                if (command) {
                    result.command = command
                }
                if (count) {
                    result.count = count
                }
            
            } else if (readPacket.name === MESSAGE_NAME.ReadyForQuery) {
                this.transactionState = String.fromCharCode(
                    readPacket.status
                ) as TransactionState
                // loop existed here for return
                return result

            } else if (readPacket.name === MESSAGE_NAME.ErrorResponse) {
                const {
                    errcode,
                    message
                } = readPacket
                throw new Error(`query error occured: ${errcode} ${message}`)
    
            } else if (readPacket.name === MESSAGE_NAME.NoticeResponse) {
                result.warnings!.push(readPacket)

            } else if (readPacket.name === MESSAGE_NAME.RowDescription) {
                result.description = {
                    count: readPacket.count,
                    fields: readPacket.fields
                }

            } else {
                throw new Error(`unexpected query response: ${readPacket.code.toString(16)}`)
            }
        }
    }

    private async extendedQuery(
        options: QueryOptions, 
        queryResult: QUERY_RESULT
    ): Promise<QueryResult> {
        // build parse writer
        const parseWriter = new ParseWriter(options.portal, options.statement)
        const bufferLength = options.portal.length + 1 + 
                            options.statement.length + 1 + 
                            4 + 1
        const parseBuffer = new BufferWriter(new Uint8Array(bufferLength))
        await this.writePacket(parseWriter.write(parseBuffer))
        // parse complete reader
        const parseCompletePacket = await this.readPacket()
        if (parseCompletePacket.name === MESSAGE_NAME.ParseComplete) {
            // nothing done here
        } else if (parseCompletePacket.name === MESSAGE_NAME.ErrorResponse) {
            const {
                errcode,
                message
            } = parseCompletePacket
            throw new Error(`extendedQuery parsed error: ${errcode} ${message}`)
        }

        // build bind writer
        const bindWriter = new BindWriter()
        // bind complete reader
        const bindCompletePacket = await this.readPacket()
        if (bindCompletePacket.name === MESSAGE_NAME.BindComplete) {
            // nothing done here
        } else if (bindCompletePacket.name === MESSAGE_NAME.ErrorResponse) {
            const {
                errcode,
                message
            } = bindCompletePacket
            throw new Error(`extendedQuery parsed error: ${errcode} ${message}`)
        }


        // build describe writer
        // build execute writer
        // build sync writer

        // initial result
        let result: QueryResult
        switch (queryResult) {
            case QUERY_RESULT.ARRAY:
                result = new ArrayQueryResult(options)
                break
            case QUERY_RESULT.OBJECT:
                result = new ObjectQueryResult(options)
                break
        }
        // readPacket, when query startup, return once
        let readPacket = await this.readPacket()
        if (readPacket.name === MESSAGE_NAME.RowDescription) {
            result.description = {
                count: readPacket.count,
                fields: readPacket.fields
            }
        
        } else if (readPacket.name === MESSAGE_NAME.EmptyQueryResponse) {
            // nothing done here
        
        } else if (readPacket.name === MESSAGE_NAME.ErrorResponse) {
            const {
                errcode,
                message
            } = readPacket
            throw new Error(`query error occured: ${errcode} ${message}`)

        } else if (readPacket.name === MESSAGE_NAME.NoticeResponse) {
            result.warnings!.push(readPacket)

        } else {
            throw new Error(`unexpected query response: ${readPacket.code.toString(16)}`)
        }

        // loop for all rows data
        while (true) {
            readPacket = await this.readPacket()
            if (readPacket.name === MESSAGE_NAME.DataRow) {
                result.insert(readPacket.fields)

            } else if (readPacket.name === MESSAGE_NAME.CommandComplete) {
                const {
                    command,
                    count
                } = readPacket
                if (command) {
                    result.command = command
                }
                if (count) {
                    result.count = count
                }
            
            } else if (readPacket.name === MESSAGE_NAME.ReadyForQuery) {
                this.transactionState = String.fromCharCode(
                    readPacket.status
                ) as TransactionState
                // loop existed here for return
                return result

            } else if (readPacket.name === MESSAGE_NAME.ErrorResponse) {
                const {
                    errcode,
                    message
                } = readPacket
                throw new Error(`query error occured: ${errcode} ${message}`)
    
            } else if (readPacket.name === MESSAGE_NAME.NoticeResponse) {
                result.warnings!.push(readPacket)

            } else if (readPacket.name === MESSAGE_NAME.RowDescription) {
                result.description = {
                    count: readPacket.count,
                    fields: readPacket.fields
                }

            } else {
                throw new Error(`unexpected query response: ${readPacket.code.toString(16)}`)
            }
        }

    }

    private startup(): Uint8Array {
        const {
            user,
            dbname,
            applicationName
        } = this.options

        const clientEncoding = 'utf-8' // always utf-8
        const startupWriter = new StartupWriter({
            version: '3.0',
            user: user,
            dbname: dbname,
            applicationName: applicationName,
            clientEncoding: clientEncoding
        })

        const bufferLength = 2 + 2 + 
                    user.length + 1 +
                    dbname.length + 1 + 
                    applicationName.length + 1
                    clientEncoding.length + 1
        const startupBuffer = new BufferWriter(new Uint8Array(bufferLength))

        return startupWriter.write(startupBuffer)
    }

    private async authenticate(): Promise<boolean> {
        const {
            user,
            password = ''
        } = this.options

        const authPacket = await this.readPacket()

        // ok
        if (authPacket.name === MESSAGE_NAME.AuthenticationOk) {
            return true

        // clearText
        } else if (authPacket.name === MESSAGE_NAME.AuthenticationCleartextPassword) {
            // build password writer
            const passwordMessageWriter = new PasswordMessageWriter(password)
            const passwordMessageBuffer = new BufferWriter(new Uint8Array(password.length + 6))
            await this.writePacket(passwordMessageWriter.write(passwordMessageBuffer))
            // password response
            const resultPacket = await this.readPacket()
            if (resultPacket.name === MESSAGE_NAME.AuthenticationOk) {
                return true
            
            } else if (resultPacket.name === MESSAGE_NAME.ErrorResponse) {
                // TODO: AuthenticationError()
                throw new Error(`authenticate error: ${resultPacket.message}`)
            } else {
                throw new Error(`authenticate unexpected error: ${resultPacket.code.toString(16)}`)
            }
        
        // md5
        } else if (authPacket.name === MESSAGE_NAME.AuthenticationMD5Password) {
            // make md5 password
            const hashword = postgresMd5Hashword(user, password, authPacket.salt)
            // build password writer
            const passwordMessageWriter = new PasswordMessageWriter(hashword)
            const passwordMessageBuffer = new BufferWriter(new Uint8Array(hashword.length + 6))
            await this.writePacket(passwordMessageWriter.write(passwordMessageBuffer))
            // password response
            const resultPacket = await this.readPacket()
            if (resultPacket.name === MESSAGE_NAME.AuthenticationOk) {
                return true
            
            } else if (resultPacket.name === MESSAGE_NAME.ErrorResponse) {
                // TODO: AuthenticationError()
                throw new Error(`authenticate error: ${resultPacket.message}`)
            } else {
                throw new Error(`authenticate unexpected error: ${resultPacket.code.toString(16)}`)
            }
        
        // other not supported
        } else {
            throw new Error(`authenticate not supported: ${authPacket.code.toString(16)}`)
        }
    }

    private async readPacket() {
        // read and parse packet from deno.conn
        try {
            const headReader = new BufferReader(new Uint8Array(5)) // 1 byte + 4 byte
            // fulfill packet head
            await this.conn!.read(headReader.buffer)
            const code = headReader.readUint16() as MESSAGE_CODE // 1 byte
            const length = headReader.readUint32() // 4 byte, Uint32BE

            const bodyReader = new BufferReader(new Uint8Array(length))
            // fulfill packet body
            await this.conn!.read(bodyReader.buffer)

            switch(code) {
                // AuthenticationReader will rename it's name by read()
                // all auth packet will return here
                case MESSAGE_CODE.AuthenticationOk:
                    return new AuthenticationReader(
                        /* name */MESSAGE_NAME.AuthenticationOk,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.BackendKeyData:
                    return new BackendKeyDataReader(
                        /* name */MESSAGE_NAME.BackendKeyData,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)

                case MESSAGE_CODE.BindComplete:
                    return new BindCompleteReader()

                case MESSAGE_CODE.CloseComplete:
                    return new CloseCompleteReader()

                case MESSAGE_CODE.CommandComplete:
                    return new CommandCompleteReader(
                        /* name */MESSAGE_NAME.CommandComplete,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)

                case MESSAGE_CODE.CopyData:
                    return new CopyDataReader(
                        /* name */MESSAGE_NAME.CopyData,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.CopyDone:
                    return new CopyDoneReader()
                
                case MESSAGE_CODE.CopyInResponse:
                    return new CopyInResponseReader(
                        /* name */MESSAGE_NAME.CopyInResponse,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.CopyOutResponse:
                    return new CopyOutResponseReader(
                        /* name */MESSAGE_NAME.CopyOutResponse,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.CopyBothResponse:
                    return new CopyBothResponseReader(
                        /* name */MESSAGE_NAME.CopyBothResponse,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.DataRow:
                    return new DataRowReader(
                        /* name */MESSAGE_NAME.DataRow,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.EmptyQueryResponse:
                    return new EmptyQueryResponseReader()
                
                case MESSAGE_CODE.ErrorResponse:
                    return new ErrorResponseReader(
                        /* name */MESSAGE_NAME.ErrorResponse,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.FunctionCallResponse:
                    return new FunctionCallResponseReader(
                        /* name */MESSAGE_NAME.FunctionCallResponse,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.NoData:
                    return new NoDataReader()
                
                case MESSAGE_CODE.NoticeResponse:
                    return new NoticeResponseReader(
                        /* name */MESSAGE_NAME.NoticeResponse,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.NotificationResponse:
                    return new NotificationResponseReader(
                        /* name */MESSAGE_NAME.NotificationResponse,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.ParameterDescription:
                    return new ParameterDescriptionReader(
                        /* name */MESSAGE_NAME.ParameterDescription,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.ParameterStatus:
                    return new ParameterStatusReader(
                        /* name */MESSAGE_NAME.ParameterStatus,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.ParseComplete:
                    return new ParseCompleteReader()
                
                case MESSAGE_CODE.PortalSuspended:
                    return new PortalSuspendedReader()
                
                case MESSAGE_CODE.ReadyForQuery:
                    return new ReadyForQueryReader(
                        /* name */MESSAGE_NAME.ReadyForQuery,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                case MESSAGE_CODE.RowDescription:
                    return new RowDescriptionReader(
                        /* name */MESSAGE_NAME.RowDescription,
                        /* code */code,
                        /* length */length
                    ).read(bodyReader)
                
                // here will never throw, but we need this for recover everything
                default:
                    throw new Error(`unknown message code: ${code.toString(16)}`)
            }

        } catch (error) {
            // TODO: throw ReadError
            throw new Error(error.message)
        }
    }

    private async writePacket(buffer: Uint8Array) {
        // write and build packet from deno.conn
        try {
            // buffer length has been padded into deno.conn
            let padded = 0 
            do {
                // used buffer.subarray() without rewrite current buffer
                padded += await this.conn!.write(buffer.subarray(padded))
            // until buffer flfill into deno.conn
            // loop for large buffer write into
            } while (padded < buffer.length)

        } catch (error) {
            // TODO: throw WriteError
            throw new Error(error.message)
        }
    }

}


/**
 * https://www.postgresql.org/docs/current/protocol-flow.html
 * password = concat('md5', md5(concat(md5(concat(password, username)), random-salt)))
 */
function postgresMd5Hashword(user: string, password: string, salt: Uint8Array): string {
    // md5(concat(password, username))
    const hash1 = createHash('md5').update(encode(password + user))
    // concat(md5(concat(password, username)), random-salt)
    const buff2 = new Uint8Array(hash1.length + salt.length)
    buff2.set(hash1)
    buff2.set(salt, hash1.length)
    // md5(concat(md5(concat(password, username)), random-salt))
    const hash2 = createHash('md5').update(buff2)
    // concat('md5', md5(concat(md5(concat(password, username)), random-salt)))
    return ['md5', hash2.toString('hex')].join('')
}