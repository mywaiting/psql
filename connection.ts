/**
 * Deno implementation of low level Postgresql frontend-backend protocol
 * https://www.postgresql.org/docs/13/protocol-message-formats.html
 */
import {
    MESSAGE_CODE,
    MESSAGE_NAME,
} from './const.ts'
import {
    BufferReader,
    BufferWriter
} from './buffer.ts'
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

    conn?: Deno.Conn = undefined

    constructor(public readonly options: ConnectionOptions) {}

    async connect(): Promise<void> {
        const {
            host,
            port,
            user,
            password
        } = this.options
        // Deno.conn
        this.conn = await Deno.connect({
            transport: 'tcp',
            hostname: host,
            port: port
        })
        // this.conn = await Deno.connect({
        //     transport: 'unix', // unixSocket
        //     path: host
        // // deno-lint-ignore no-explicit-any
        // } as any)
    }

    close(): void {

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
            let padded = 0 // buffer length has been padded into deno.conn
            do {
                // buffer.subarray without rewrite current buffer
                padded += await this.conn!.write(buffer.subarray(padded))

            } while (padded < buffer.length)

        } catch (error) {
            // TODO: throw WriteError
            throw new Error(error.message)
        }
    }

}

