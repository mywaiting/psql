




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
    }

    close(): void {

    }


}










