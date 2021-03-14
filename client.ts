
import {
    Connection,
    ConnectionOptions
} from './connection.ts'





class ClientMixin {

}



export interface ClientOptions {
    host?: string,
    port?: string | number, // 5432
    dbname?: string,
    user?: string,
    password?: string,
    options?: Record<string, string>,
    applicationName?: string
}


export class Client extends ClientMixin {

    connection: Connection

    constructor(options: ClientOptions | string) {
        super()
        const connectionOptions = new _ClientOptions(options).connectionOptions
        this.connection = new Connection(connectionOptions)
    }

    async connect(): Promise<void> {
        await this.connection.connect()
    }

    async close(): Promise<void> {
        await this.connection.close()
    }
}




class _ClientOptions {

    connectionOptions: ConnectionOptions

    constructor(options: string | ClientOptions = {}) {
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

        const connectionOptions: ConnectionOptions = {
            host: options.host ?? pqEnv.host ?? '127.0.0.1',
            port: parseInt(port),
            dbname: options.dbname ?? pqEnv.dbname ?? '',
            user: options.user ?? pqEnv.user ?? '',
            password: options.password ?? pqEnv.password,
            options: options.options ?? pqEnv.options,
            applicationName: options.applicationName ?? pqEnv.applicationName ?? 'pq'
        }
        this.connectionOptions = connectionOptions
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