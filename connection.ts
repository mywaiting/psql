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
    PORTAL_STATEMENT_TYPE,
    TRANSACTION_STATUS
} from './const.ts'
import {
    BufferReader,
    BufferWriter,
    decode,
    encode,
} from './buffer.ts'
import {
    QueryOptions,
    QueryResult,
    QueryResultType,
    ArrayQueryResult,
    ObjectQueryResult,
} from './cursor.ts'
import {
    DeferredStack
} from './deferred.ts'
import {
    AuthenticationError,
    ConnectionError,
    PacketError,
    QueryError,
} from './error.ts'
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
    NegotiateProtocolVersionReader,
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



const DEBUG = false


export enum ConnectionStatus {
    Connecting,
    Connected,
    Closing,
    Closed,
}


/**
 * sslRequest response is very special that without any packetHeader, jsut a single byte
 * 0x53 = 83 = 'S', accepts ssl request.
 * 0x4e = 78 = 'N', not more ssl request.
 */
 export const enum SSL_STATUS {
    Accept = 0x53,
    Reject = 0x4e,
}


export interface ConnectionOptions {
    host: string,
    port: number,
    database: string,
    user: string,
    password?: string,
    options?: Record<string, string>,
    applicationName: string
}


/**
 * connection flow 
 * https://www.pgcon.org/2014/schedule/attachments/330_postgres-for-the-wire.pdf
 * chinese version: http://mysql.taobao.org/monthly/2020/03/02/
 */
export class Connection {

    connectionStatus: ConnectionStatus = ConnectionStatus.Connecting
    transactionStatus?: TRANSACTION_STATUS

    // deno-lint-ignore no-explicit-any
    serverInfo: Record<string, any> = {} // for server parameters/status
    queryLock: DeferredStack<undefined> = new DeferredStack(
        /* max */1,
        /* iterable */[undefined],
        /* initial */
    )

    conn?: Deno.Conn = undefined

    constructor(public readonly options: ConnectionOptions) {}

    /**
     * client/server packet flows:
     * 
     * client       --->  ssl request  --->         server (optional)
     * client         --->  startup  --->           server
     * client   <---  auth request | auth ok <---   server
     * client      --->  password message --->      server (optional)
     * client      <---  parameter status <---      server
     * client      <---  parameter status <---      server
     * client      <---  parameter status <---      server
     * client      <---  backend key data <---      server
     * client      <---  ready for query  <---      server
     */
    async connect(): Promise<void> {
        // change connectionStatus
        this.connectionStatus = ConnectionStatus.Connecting

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

        // check sslRequest before startup
        const sslAccepts = await this.sslAccepts()
        if (sslAccepts) {
            try {
                // @ts-ignore TS2339
                if (typeof Deno.startTls === 'undefined') {
                    /**
                     * TypeError within JS, means invalid arguments or parameters.
                     * without `--unstable` argument is invalid for ssl accepts.
                     */
                    throw new TypeError(`execute deno with '--unstable' argument to stablish SSL/TLS connection`)
                }
                // @ts-ignore TS2339
                this.conn = await Deno.startTls(this.conn, {
                    hostname: host,
                    // certFile: '',
                })
    
            } catch (error) {
                // recover as tcp connect without ssl
                this.conn = await Deno.connect({
                    transport: 'tcp',
                    hostname: host,
                    port: port
                })
            }
        }

        // try connection flows
        try {
            // startup
            await this.startup()
            // authentication
            await this.authenticate()

            // connection
            waiting:
            while (true) {
                const readPacket = await this.readPacket()
                // error
                if (readPacket.packetName === MESSAGE_NAME.ErrorResponse) {
                    const {
                        code,
                        message
                    } = readPacket
                    throw new ConnectionError(`connect error occured: ${code} ${message}`)

                // backendKeyData
                } else if (readPacket.packetName === MESSAGE_NAME.BackendKeyData) {
                    Object.assign(this.serverInfo, {
                        processId: readPacket.processId,
                        secretKey: readPacket.secretKey
                    })

                // parameterStatue
                } else if (readPacket.packetName === MESSAGE_NAME.ParameterStatus) {
                    const name = readPacket.name
                    const value = readPacket.value
                    // server paramenters all in here
                    this.serverInfo[name] = value

                // readyForQuery
                } else if (readPacket.packetName === MESSAGE_NAME.ReadyForQuery) {
                    this.transactionStatus = readPacket.transactionStatus
                    // break label
                    break waiting
                }
            }
            // change connectionStatus
            this.connectionStatus = ConnectionStatus.Connected

        } catch (error) {
            // socket closed
            this.conn!.close()
            // change connectionStatus
            this.connectionStatus = ConnectionStatus.Closing
            // throw current error
            throw new ConnectionError(error.message)
        }
    }

    async close(): Promise<void> {
        if (this.connectionStatus !== ConnectionStatus.Closed) {
            // change connectionStatus
            this.connectionStatus = ConnectionStatus.Closing
            // Terminate Message sended before closed
            const terminateWriter = new TerminateWriter()
            const terminateBuffer = new BufferWriter(new Uint8Array(5))
            await this.writePacket(terminateWriter.write(terminateBuffer))
            // socket closed
            this.conn!.close()
            // change connectionStatus
            this.connectionStatus = ConnectionStatus.Closed
        }
    }

    async query(options: QueryOptions, type: QueryResultType): Promise<QueryResult> {
        if (this.connectionStatus !== ConnectionStatus.Connected) {
            throw new ConnectionError(`connection initial before execute`)
        }
        // acquire query lock
        await this.queryLock.pop()
        // exec query
        try {
            if (options.parameters!.length === 0) {
                return await this.simpleQuery(options, type)
            } else {
                return await this.prepareQuery(options, type)
            }

        } catch (error) {
            /**
             * error here throwed by others, for example, PacketError
             * will never thorw here, error throwed here is beyond within `error.ts`.
             * so just throwed directly
             */
            throw error

        } finally {
            // release query lock
            this.queryLock.push(undefined)
        }
    }

    /**
     * client/server packet flows:
     * 
     * client           --->  query  --->          server
     * client      <---  row description <---      server
     * client          <---  data row <---         server
     * client          <---  data row <---         server 
     * client          <---  data row <---         server
     * client      <---  command complete <---     server
     * client      <---  ready for query  <---     server
     */
    private async simpleQuery(
        options: QueryOptions, 
        type: QueryResultType
    ): Promise<QueryResult> {
        // build query writer
        const queryWriter = new QueryWriter(options.query)
        const queryBuffer = new BufferWriter(new Uint8Array(options.query.length + 1))
        await this.writePacket(queryWriter.write(queryBuffer))

        // initial result
        let result: QueryResult
        switch (type) {
            case QueryResultType.ARRAY:
                result = new ArrayQueryResult(options)
                break
            case QueryResultType.OBJECT:
                result = new ObjectQueryResult(options)
                break
        }

        // readPacket, when query startup, return once
        let readPacket = await this.readPacket()
        if (readPacket.packetName === MESSAGE_NAME.RowDescription) {
            result.description = {
                count: readPacket.count,
                fields: readPacket.fields
            }
        
        } else if (readPacket.packetName === MESSAGE_NAME.EmptyQueryResponse) {
            // nothing done here
        
        } else if (readPacket.packetName === MESSAGE_NAME.ErrorResponse) {
            const {
                code,
                message
            } = readPacket
            throw new QueryError(`query error occured: ${code} ${message}`)

        } else if (readPacket.packetName === MESSAGE_NAME.NoticeResponse) {
            result.warnings!.push(readPacket)

        } else if (readPacket.packetName === MESSAGE_NAME.CommandComplete) {
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
            throw new PacketError(`unexpected query response packet: ${readPacket.packetCode.toString(16)}`)
        }

        // loop for all rows data
        while (true) {
            readPacket = await this.readPacket()
            if (readPacket.packetName === MESSAGE_NAME.DataRow) {
                result.insert(readPacket.fields)

            } else if (readPacket.packetName === MESSAGE_NAME.CommandComplete) {
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
            
            } else if (readPacket.packetName === MESSAGE_NAME.ReadyForQuery) {
                this.transactionStatus = readPacket.transactionStatus
                // loop existed here for return
                return result

            } else if (readPacket.packetName === MESSAGE_NAME.ErrorResponse) {
                const {
                    code,
                    message
                } = readPacket
                throw new Error(`query error occured: ${code} ${message}`)
    
            } else if (readPacket.packetName === MESSAGE_NAME.NoticeResponse) {
                result.warnings!.push(readPacket)

            } else if (readPacket.packetName === MESSAGE_NAME.RowDescription) {
                result.description = {
                    count: readPacket.count,
                    fields: readPacket.fields
                }

            } else {
                throw new PacketError(`unexpected query response packet: ${readPacket.packetCode.toString(16)}`)
            }
        }
    }

    /**
     * client/server packet flows:
     * 
     * client           --->  parse  --->          server
     * client           --->  bind   --->          server
     * client         --->  describe   --->        server
     * client          --->  execute  --->         server
     * client           --->  sync   --->          server
     * 
     * client          <---  parse ok <---         server
     * client          <---  bind ok  <---         server
     * client      <---  row description <---      server
     * client          <---  data row <---         server
     * client          <---  data row <---         server 
     * client          <---  data row <---         server
     * client      <---  command complete <---     server
     * client      <---  ready for query  <---     server
     */
    private async prepareQuery(
        options: QueryOptions, 
        type: QueryResultType
    ): Promise<QueryResult> {
        // build parse writer
        {
            const parseWriter = new ParseWriter(options.statement, options.query)
            const bufferLength = options.portal.length + 1 + 
                                options.statement.length + 1 + 2
            const parseBuffer = new BufferWriter(new Uint8Array(bufferLength))
            await this.writePacket(parseWriter.write(parseBuffer))
        }
        // build bind writer
        {
            const bindWriter = new BindWriter(
                options.portal, 
                options.statement,
                options.parameters
            )
            const bufferLength = 1024 // just a guess value
            const bindBuffer = new BufferWriter(new Uint8Array(bufferLength))
            await this.writePacket(bindWriter.write(bindBuffer))
        }
        // build describe writer
        {
            const describeWriter = new DescribeWriter(
                PORTAL_STATEMENT_TYPE.PORTAL,
                options.portal
            )
            const bufferLength = options.portal.length + 2
            /**
             * here can fetch statement parameters description.
             * but not use this regularly.
             * because postgres prepare query use portal but not statement
             */
            // const describeWriter = new DescribeWriter(
            //     PORTAL_STATEMENT_TYPE.STATEMENT,
            //     options.statement
            // )
            // const bufferLength = options.statement.length + 2
            const describeBuffer = new BufferWriter(new Uint8Array(bufferLength))
            await this.writePacket(describeWriter.write(describeBuffer))
        }
        // build execute writer
        {
            const executeWriter = new ExecuteWriter(
                options.portal
            )
            const bufferLength = options.portal.length + 4
            const executeBuffer = new BufferWriter(new Uint8Array(bufferLength))
            await this.writePacket(executeWriter.write(executeBuffer))
        }
        // build sync writer
        {
            const syncWriter = new SyncWriter()
            const syncBuffer = new BufferWriter(new Uint8Array())
            await this.writePacket(syncWriter.write(syncBuffer))
        }

        // parse complete reader
        const parseCompletePacket = await this.readPacket()
        if (parseCompletePacket.packetName === MESSAGE_NAME.ParseComplete) {
            // nothing done here
        } else if (parseCompletePacket.packetName === MESSAGE_NAME.ErrorResponse) {
            const {
                code,
                message
            } = parseCompletePacket
            throw new Error(`extendedQuery parsed error: ${code} ${message}`)
        }

        // bind complete reader
        const bindCompletePacket = await this.readPacket()
        if (bindCompletePacket.packetName === MESSAGE_NAME.BindComplete) {
            // nothing done here
        } else if (bindCompletePacket.packetName === MESSAGE_NAME.ErrorResponse) {
            const {
                code,
                message
            } = bindCompletePacket
            throw new Error(`extendedQuery parsed error: ${code} ${message}`)
        }

        // initial result
        let result: QueryResult
        switch (type) {
            case QueryResultType.ARRAY:
                result = new ArrayQueryResult(options)
                break
            case QueryResultType.OBJECT:
                result = new ObjectQueryResult(options)
                break
        }
        
        // readPacket, when query startup, return once
        let readPacket = await this.readPacket()
        if (readPacket.packetName === MESSAGE_NAME.RowDescription) {
            result.description = {
                count: readPacket.count,
                fields: readPacket.fields
            }
        
        } else if (readPacket.packetName === MESSAGE_NAME.EmptyQueryResponse) {
            // nothing done here
        
        } else if (readPacket.packetName === MESSAGE_NAME.ErrorResponse) {
            const {
                code,
                message
            } = readPacket
            throw new Error(`query error occured: ${code} ${message}`)

        } else if (readPacket.packetName === MESSAGE_NAME.NoticeResponse) {
            result.warnings!.push(readPacket)

        } else {
            throw new PacketError(`unexpected query response packet: ${readPacket.packetCode.toString(16)}`)
        }

        // loop for all rows data
        while (true) {
            readPacket = await this.readPacket()
            if (readPacket.packetName === MESSAGE_NAME.DataRow) {
                result.insert(readPacket.fields)

            } else if (readPacket.packetName === MESSAGE_NAME.CommandComplete) {
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
            
            } else if (readPacket.packetName === MESSAGE_NAME.ReadyForQuery) {
                this.transactionStatus = readPacket.transactionStatus
                // loop existed here for return
                return result

            } else if (readPacket.packetName === MESSAGE_NAME.ErrorResponse) {
                const {
                    code,
                    message
                } = readPacket
                throw new Error(`query error occured: ${code} ${message}`)
    
            } else if (readPacket.packetName === MESSAGE_NAME.NoticeResponse) {
                result.warnings!.push(readPacket)

            } else if (readPacket.packetName === MESSAGE_NAME.RowDescription) {
                result.description = {
                    count: readPacket.count,
                    fields: readPacket.fields
                }

            } else {
                throw new PacketError(`unexpected query packet response: ${readPacket.packetCode.toString(16)}`)
            }
        }

    }

    private async sslAccepts(): Promise<boolean> {
        // sslRequest
        const sslRequestWriter = new SSLRequestWriter()
        const sslRequestBuffer = new BufferWriter(new Uint8Array(8))
        await this.writePacket(sslRequestWriter.write(sslRequestBuffer))

        /**
         * to initiate an SSL-encrypted connection, the frontend initially sends an SSLRequest 
         * message rather than a StartupMessage. The server then responds with a single byte 
         * containing S or N, indicating that it is willing or unwilling to perform SSL, respectively
         * 
         * sslRequest response is very special that without any packetHeader, jsut a single byte
         * 0x53 = 83 = 'S', accepts ssl request.
         * 0x4e = 78 = 'N', not more ssl request.
         */
        const sslReader = new BufferReader(new Uint8Array(1)) // a single byte
        await this.conn!.read(sslReader.buffer)

        if (DEBUG) {
            console.log('connection.sslAccepts:',
                'packetCode', decode(sslReader.buffer.slice(0, 1)),
                'packetLength', sslReader.buffer.length,
            )
        }

        const sslStatus = sslReader.readUint8() as SSL_STATUS
        switch (sslStatus) {
            case SSL_STATUS.Accept:
                return true
            case SSL_STATUS.Reject:
                return false
            default:
                // this will never happend, but still write this here
                throw new ConnectionError(`connection error to stablish SSL/TLS connection`)
        }
    }

    private async startup() {
        const {
            user,
            database,
            applicationName
        } = this.options

        const clientEncoding = 'utf-8'
        const startupWriter = new StartupWriter(
            /* user */user,
            /* database */database,
            /* applicationName */applicationName,
            /* clientEncoding */clientEncoding
        )

        const bufferLength = 4 + 4 
                    user.length + 1 +
                    database.length + 1 + 
                    applicationName.length + 1 +
                    clientEncoding.length + 1 + 2
        const startupBuffer = new BufferWriter(new Uint8Array(bufferLength))

        await this.writePacket(startupWriter.write(startupBuffer))
    }

    private async authenticate(): Promise<boolean> {
        const {
            user,
            password = ''
        } = this.options

        const authPacket = await this.readPacket()

        // error
        if (authPacket.packetName === MESSAGE_NAME.ErrorResponse) {
            const {
                message,
                line,
            } = authPacket
            throw new AuthenticationError(`authenticate error occured: ${message || line}`)

        // ok = 0x00
        } else if (authPacket.packetName === MESSAGE_NAME.AuthenticationOk) {
            return true

        // clearText = 0x03
        } else if (authPacket.packetName === MESSAGE_NAME.AuthenticationCleartextPassword) {
            // build password writer
            const passwordMessageWriter = new PasswordMessageWriter(password)
            const passwordMessageBuffer = new BufferWriter(new Uint8Array(password.length))
            await this.writePacket(passwordMessageWriter.write(passwordMessageBuffer))

            // password response
            const resultPacket = await this.readPacket()
            if (resultPacket.packetName === MESSAGE_NAME.AuthenticationOk) {
                return true
            
            } else if (resultPacket.packetName === MESSAGE_NAME.ErrorResponse) {
                throw new AuthenticationError(`authenticate error: ${resultPacket.message}`)
            } else {
                throw new AuthenticationError(`authenticate unexpected error: ${resultPacket.packetCode.toString(16)}`)
            }
        
        // md5 = 0x05
        } else if (authPacket.packetName === MESSAGE_NAME.AuthenticationMD5Password) {
            // make md5 password
            const hashword = postgresMd5Hashword(user, password, authPacket.salt)
            // build password writer
            const passwordMessageWriter = new PasswordMessageWriter(hashword)
            const passwordMessageBuffer = new BufferWriter(new Uint8Array(hashword.length))
            await this.writePacket(passwordMessageWriter.write(passwordMessageBuffer))
            // password response
            const resultPacket = await this.readPacket()
            if (resultPacket.packetName === MESSAGE_NAME.AuthenticationOk) {
                return true
            
            } else if (resultPacket.packetName === MESSAGE_NAME.ErrorResponse) {
                throw new AuthenticationError(`authenticate error: ${resultPacket.message}`)
            } else {
                throw new AuthenticationError(`authenticate unexpected error: ${resultPacket.packetCode.toString(16)}`)
            }
        
        // sasl = 0x0a
        // } else if (authPacket.packetName === MESSAGE_NAME.AuthenticationSASL) {
        //     // restore SASL mechanisms
        //     this.serverInfo['saslMechanisms'] = authPacket.mechanisms
        //     // build saslInitialResponse writer
        //     const saslInitialResponseWriter = new SASLInitialResponseWriter(
        //         /* mechanism */'SCRAM-SHA-256',
        //         /* initialResponse */
        //     )

        // negotiateProtocolVersion
        } else if (authPacket.packetName === MESSAGE_NAME.NegotiateProtocolVersion) {
            throw new ConnectionError(`server and client with 
                negotiate protocol version: ${authPacket.newestVersion}
                negotiate protocol options: ${authPacket.options}
            `)
        
        // other not supported
        } else {
            throw new AuthenticationError(`authenticate not supported: ${authPacket.packetCode.toString(16)}`)
        }
    }

    private async readPacket() {
        // read and parse packet from deno.conn
        try {
            const headerReader = new BufferReader(new Uint8Array(5)) // 1 byte + 4 byte
            // fulfill packet head
            await this.conn!.read(headerReader.buffer)
            const packetCode = headerReader.readUint8() as MESSAGE_CODE // 1 byte
            const packetLength = headerReader.readInt32() // 4 byte, Int32BE

            const bodyReader = new BufferReader(new Uint8Array(packetLength - 4)) // except packetLength 4 bytes
            // fulfill packet body
            await this.conn!.read(bodyReader.buffer)

            if (DEBUG) {
                console.log('connection.readPacket:',
                    'packetCode', decode(headerReader.buffer.slice(0, 1)), 
                    'packetLength', packetLength,
                    'BodyLength', packetLength - 4
                )
            }

            switch(packetCode) {
                // AuthenticationReader will rename it's name by read()
                // all auth packet will return here
                case MESSAGE_CODE.AuthenticationOk:
                    return new AuthenticationReader(
                        /* name */MESSAGE_NAME.AuthenticationOk,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.BackendKeyData:
                    return new BackendKeyDataReader(
                        /* name */MESSAGE_NAME.BackendKeyData,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)

                case MESSAGE_CODE.BindComplete:
                    return new BindCompleteReader()

                case MESSAGE_CODE.CloseComplete:
                    return new CloseCompleteReader()

                case MESSAGE_CODE.CommandComplete:
                    return new CommandCompleteReader(
                        /* name */MESSAGE_NAME.CommandComplete,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)

                case MESSAGE_CODE.CopyData:
                    return new CopyDataReader(
                        /* name */MESSAGE_NAME.CopyData,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.CopyDone:
                    return new CopyDoneReader()
                
                case MESSAGE_CODE.CopyInResponse:
                    return new CopyInResponseReader(
                        /* name */MESSAGE_NAME.CopyInResponse,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.CopyOutResponse:
                    return new CopyOutResponseReader(
                        /* name */MESSAGE_NAME.CopyOutResponse,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.CopyBothResponse:
                    return new CopyBothResponseReader(
                        /* name */MESSAGE_NAME.CopyBothResponse,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.DataRow:
                    return new DataRowReader(
                        /* name */MESSAGE_NAME.DataRow,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.EmptyQueryResponse:
                    return new EmptyQueryResponseReader()
                
                case MESSAGE_CODE.ErrorResponse:
                    return new ErrorResponseReader(
                        /* name */MESSAGE_NAME.ErrorResponse,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.FunctionCallResponse:
                    return new FunctionCallResponseReader(
                        /* name */MESSAGE_NAME.FunctionCallResponse,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.NegotiateProtocolVersion:
                    return new NegotiateProtocolVersionReader(
                        /* name */MESSAGE_NAME.NegotiateProtocolVersion,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.NoData:
                    return new NoDataReader()
                
                case MESSAGE_CODE.NoticeResponse:
                    return new NoticeResponseReader(
                        /* name */MESSAGE_NAME.NoticeResponse,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.NotificationResponse:
                    return new NotificationResponseReader(
                        /* name */MESSAGE_NAME.NotificationResponse,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.ParameterDescription:
                    return new ParameterDescriptionReader(
                        /* name */MESSAGE_NAME.ParameterDescription,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.ParameterStatus:
                    return new ParameterStatusReader(
                        /* name */MESSAGE_NAME.ParameterStatus,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.ParseComplete:
                    return new ParseCompleteReader()
                
                case MESSAGE_CODE.PortalSuspended:
                    return new PortalSuspendedReader()
                
                case MESSAGE_CODE.ReadyForQuery:
                    return new ReadyForQueryReader(
                        /* name */MESSAGE_NAME.ReadyForQuery,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                case MESSAGE_CODE.RowDescription:
                    return new RowDescriptionReader(
                        /* name */MESSAGE_NAME.RowDescription,
                        /* code */packetCode,
                        /* length */packetLength
                    ).read(bodyReader)
                
                // here will never throw in normal, but we need this for recover everything
                default:
                    throw new PacketError(`unknown message code: ${packetCode.toString(16)}`)
            }

        } catch (error) {
            throw new PacketError(`[connection.readPacket] ${error.message}`)
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
            throw new PacketError(`[connection.writePacket] ${error.message}`)
        }
    }

}


/**
 * https://www.postgresql.org/docs/current/protocol-flow.html
 * password = concat('md5', md5(concat(md5(concat(password, username)), random-salt)))
 */
function postgresMd5Hashword(user: string, password: string, salt: Uint8Array): string {
    // md5(concat(password, username))
    const hash1 = createHash('md5').update(encode(password + user)).toString('hex')
    const buff1 = encode(hash1)
    const buff2 = new Uint8Array(buff1.length + salt.length)
    buff2.set(buff1)
    buff2.set(salt, buff1.length)
    const hash2 = createHash('md5').update(buff2).toString('hex')
    return 'md5' + hash2
}