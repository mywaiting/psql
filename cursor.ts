import {
    Connection
} from './connection.ts'
import {
    TypeWriter
} from './types.ts'





export class Cursor {
    constructor(
        public connection: Connection, 
        public options: Record<string, string> = {}
    ) {}
    execute() {}
    
    private prepareArgs(executeOptions: ExecuteOptions): EncodedArg[] {
        const converter = executeOptions.converter ? executeOptions.converter : new TypeWriter().encode
        return (executeOptions.arguments || []).map(converter)
    }
}


export class ArrayCursor extends Cursor {

}


export class ObjectCursor extends Cursor {
    
}



export type EncodedArg = null | string | Uint8Array

export interface ExecuteOptions {
    portal?: string, // postgres portal name, default is empty string
    statement: string,
    arguments?: Array<unknown>,
    converter?: (argument: unknown) => EncodedArg
}
export interface ArrayExecuteOptions extends ExecuteOptions {
    cursor: 'array',
}
export interface ObjectExecuteOptions extends ExecuteOptions {
    cursor: 'object'
}


/**
 * result set prepare for cursor query
 */
export class ResultSet {}
export class ArrayResultSet<ResultT extends Array<unknown>> extends ResultSet {
    public rows: ResultT[] = []
}
export class ObjectResultSet<ResultT extends Record<string, unknown>> extends ResultSet {
    public rows: ResultT[] = []
}




