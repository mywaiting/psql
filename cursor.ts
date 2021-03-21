import {
    Connection
} from './connection.ts'
import {
    TypeReader,
    TypeWriter
} from './types.ts'





export class Cursor {
    constructor(
        public connection: Connection, 
        public options: Record<string, string> = {}
    ) {}
    execute() {}
}


export class ArrayCursor extends Cursor {

}


export class ObjectCursor extends Cursor {
    
}



export type EncodedArg = null | string | Uint8Array






/**
 * query options pased to simpleQuery/entendedQuery
 */
export interface ArrayQueryOptions {
    portal?: string, // postgres portal name, default is empty string
    statement: string,
    parameters?: Array<unknown>,
    converter?: (argument: unknown) => EncodedArg
}
export interface ObjectQueryOptions extends ArrayQueryOptions {
    // portal?: string,
    // statement: string,
    // parameters?: Array<unknown>,
    // converter?: (argument: unknown) => EncodedArg,
    fields?: string[]
}
export class QueryOptions {
    public portal: string
    public statement: string
    public parameters?: EncodedArg[]
    public fields?: string[]

    constructor(options: ObjectQueryOptions)
    constructor(statement: string, ...parameters: unknown[])
    constructor(overloadArg: ObjectQueryOptions | string, ...parameters: unknown[]) {
        let queryOptions: ArrayQueryOptions
        if (typeof overloadArg === 'string') {
            queryOptions = {
                statement: overloadArg,
                parameters
            }
        } else {
            const {
                fields,
                ...restOptions
            } = overloadArg

            // check fields valid
            if (fields) {
                const cleanFields = fields.map((field) => 
                    field.toString().toLowerCase()
                )
                if ((new Set(cleanFields)).size !== cleanFields.length) {
                    throw new Error(`fields for query not unique`)
                }
                this.fields = cleanFields
            }
            queryOptions = restOptions
        }
        this.portal = queryOptions.portal || ''
        this.statement = queryOptions.statement
        this.parameters = this.optionsParameters(queryOptions)
    }

    private optionsParameters(options: ArrayQueryOptions): EncodedArg[] {
        const converter = options.converter ? options.converter : new TypeWriter().encode
        return (options.parameters || []).map(converter)
    }
}


/**
 * query result prepare for cursor query
 */
export class QueryResult {
    public command?: string // command tag
    public count?: number = 0 // rowCount
    // deno-lint-ignore no-explicit-any
    public description?: Record<string, any> = {} // rowDescription
    // deno-lint-ignore no-explicit-any
    public warnings?: Record<string, any> = {}

    constructor(public queryOptions: QueryOptions) {}

    insert(row: Uint8Array[]) {
        throw new Error(`not implemented`)
    }
}

const typeReader = new TypeReader()

export class ArrayQueryResult<ResultT extends Array<unknown>> extends QueryResult {
    public rows: ResultT[] = [] // dataRow

    insert(row: Uint8Array[]) {
        if (!this.description) {
            throw new Error(`row description required before rows parse`)
        }
        const decodedValue = row.map((rawValue, index) => {
            const field = this.description!.fields[index]
            if (rawValue === null) {
                return null
            }
            return typeReader.decode(rawValue, field.dataTypeId)
        }) as ResultT

        this.rows.push(decodedValue)
    }
}
export class ObjectQueryResult<ResultT extends Record<string, unknown>> extends QueryResult {
    public rows: ResultT[] = [] // dataRow

    insert(row: Uint8Array[]) {
        if (!this.description) {
            throw new Error(`row description required before rows parse`)
        }
        if (
            this.queryOptions.fields 
            && this.queryOptions.fields.length !== this.description!.fields.length
        ) {
            throw new Error(`fields provided for query not match rows description fields`)
        }
        const decodedValue = row.reduce((row, rawValue, index) => {
            const field = this.description!.fields[index]
            const name = this.queryOptions.fields?.[index] ?? field.name
            if (rawValue === null) {
                row[name] = null
            } else {
                row[name] = typeReader.decode(rawValue, field.dataTypeId)
            }
            return row
        }, {} as Record<string, unknown>) as ResultT

        this.rows.push(decodedValue)
    }
}

export enum QUERY_RESULT {
    ARRAY = 0x00,
    OBJECT = 0x01
}