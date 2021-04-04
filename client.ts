
import {
    Connection,
    ConnectionOptions
} from './connection.ts'
import {
    Cursor,
    CursorOptions,
    ArrayCursor,
    ObjectCursor
} from './cursor.ts'
import {
    DeferredStack
} from './deferred.ts'





export interface ClientOptions {
    host?: string,
    port?: string | number, // 5432
    database?: string,
    user?: string,
    password?: string,
    options?: Record<string, string>,
    applicationName?: string
}


export class ClientOptionsReader {

    constructor(public options: string | ClientOptions = {}) {}

    read(): ConnectionOptions {
        let options = this.options
        if (typeof options === 'string') {
            options = this.pqDSN(options)
        }
        // check deno env access
        let pqEnv: ClientOptions = {}
        let denoEnvAccess = true
        try {
            pqEnv = this.pqEnv()
        } catch (error) {
            if (error instanceof Deno.errors.PermissionDenied) {
                denoEnvAccess = false
            } else {
                throw error
            }
        }
        // port integer or string
        let port: string
        if (options.port) {
            port = String(options.port)
        } else if (pqEnv.port) {
            port = String(options.port)
        } else {
            port = '5432'
        }

        return {
            host: options.host ?? pqEnv.host ?? '127.0.0.1',
            port: parseInt(port),
            database: options.database ?? pqEnv.database ?? '',
            user: options.user ?? pqEnv.user ?? '',
            password: options.password ?? pqEnv.password,
            options: options.options ?? pqEnv.options,
            applicationName: options.applicationName ?? pqEnv.applicationName ?? 'pq'
        }
    }

    /**
     * dsn: postgresql://[user[:password]@][host][:port][,...][/database][?param1=value1&...]
     * https://www.postgresql.org/docs/13/libpq-connect.html#LIBPQ-CONNSTRING
     */
    pqDSN(dsn: string): ClientOptions {
        // URL object won't parse the URL if it doesn't recognize the protocol
        // this line replaces the protocol with http and then leaves it up to URL
        const [protocol, strippedUrl] = dsn.match(/(?:(?!:\/\/).)+/g) ?? ["", ""]
        const url = new URL(`http:${strippedUrl}`)
        const options = Object.fromEntries(url.searchParams.entries())

        if (protocol !== 'postgres' && protocol !== 'postgresql') {
            throw new Error(`dsn string with invalid driver: ${protocol}`)
        }

        return {
            // driver: protocol,
            host: url.hostname,
            port: url.port,
            database: url.pathname.slice(1), // remove leading slash from path
            user: url.username,
            password: url.password,
            options: options,
            applicationName: options.applicationName
        }
    }

    /**
     * following environment variables can be used to as connection parameter values
     * https://www.postgresql.org/docs/13/libpq-envars.html
     */
    pqEnv(): ClientOptions {
        const params = Deno.env.get("PGOPTIONS") // 'a=1 b=2 c=3'
        const options = params ? params.split(' ').reduce(
            (prev: Record<string, string>, curr: string) => {
                const [key, value] = curr.split('=')
                prev[key] = value
                return prev
            }, {} // initialValue
        ) : {}
        return {
            // driver: 'postgresql',
            host: Deno.env.get("PGHOST"),
            port: Deno.env.get("PGPORT"),
            database: Deno.env.get("PGDATABASE"),
            user: Deno.env.get("PGUSER"),
            password: Deno.env.get("PGPASSWORD"),
            options: options,
            applicationName: Deno.env.get("PGAPPNAME")
        }
    }
}


export class Client {

    connection: Connection

    constructor(options: ClientOptions | string) {
        const clientOptions = new ClientOptionsReader(options)
        this.connection = new Connection(clientOptions.read())
    }

    async connect(): Promise<void> {
        await this.connection.connect()
    }

    /**
     * https://stackoverflow.com/questions/12802317/passing-class-as-parameter-causes-is-not-newable-error
     */
    cursor(
        // cursorFactory: new (connection: Connection | DeferredStack<Connection>, options: CursorOptions) => ArrayCursor | ObjectCursor = ArrayCursor,
        // deno-lint-ignore no-explicit-any
        cursorFactory: any = ArrayCursor,
        options: CursorOptions = {}
    ) {
        // pass connection instance to cursor factory
        const cursor = new cursorFactory(this.connection as Connection, options)
        return cursor
    }

    close(): void {
        this.connection.close()
    }
}


export class Pool {

    connections!: Array<Connection>
    connectionOptions!: ConnectionOptions

    maxConnections!: number
    availableConnections!: DeferredStack<Connection>

    constructor(options: ClientOptions | string, maxConnections: number = 3) {
        const clientOptions = new ClientOptionsReader(options)
        this.connectionOptions = clientOptions.read()
        this.maxConnections = maxConnections
    }

    async connect(): Promise<void> {
        // connections
        const connections = new Array(this.maxConnections).map(async () => 
            await this._connect()
        )
        this.connections = await Promise.all(connections)
        // initial available connections
        this.availableConnections = new DeferredStack(
            /* max */this.maxConnections,
            /* iterable */this.connections,
            /* initial */this._connect.bind(this)
        )
    }

    private async _connect(): Promise<Connection> {
        const connection = new Connection(this.connectionOptions)
        await connection.connect()
        return connection
    }

    /**
     * https://stackoverflow.com/questions/12802317/passing-class-as-parameter-causes-is-not-newable-error
     */
    cursor(
        // cursorFactory: new (connection: Connection | DeferredStack<Connection>, options: CursorOptions) => ArrayCursor | ObjectCursor = ArrayCursor,
        // deno-lint-ignore no-explicit-any
        cursorFactory: any = ArrayCursor,
        options: CursorOptions = {}
    ) {
        // pass deferred stack connections instance to cursor factory
        const cursor = new cursorFactory(this.availableConnections as DeferredStack<Connection>, options)
        return cursor
    }

    async close(): Promise<void> {
        while (this.availableConnections.available) {
            const connection = await this.availableConnections.pop()
            await connection.close()
        }
    }


}


