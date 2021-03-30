
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





export interface ClientOptions {
    host?: string,
    port?: string | number, // 5432
    dbname?: string,
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
            dbname: options.dbname ?? pqEnv.dbname ?? '',
            user: options.user ?? pqEnv.user ?? '',
            password: options.password ?? pqEnv.password,
            options: options.options ?? pqEnv.options,
            applicationName: options.applicationName ?? pqEnv.applicationName ?? 'pq'
        }
    }

    /**
     * dsn: postgresql://[user[:password]@][host][:port][,...][/dbname][?param1=value1&...]
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
            dbname: url.pathname.slice(1), // remove leading slash from path
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
            dbname: Deno.env.get("PGDATABASE"),
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
        cursorFactory: new (connection: Connection, options: CursorOptions) => ArrayCursor | ObjectCursor,
        options: CursorOptions
    ): Cursor {
        const cursor = new cursorFactory(this.connection, options)
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

    constructor(options: ClientOptions | string, maxConnections: number = 3) {
        const clientOptions = new ClientOptionsReader(options)
        this.connectionOptions = clientOptions.read()
        this.maxConnections = maxConnections
    }

}


