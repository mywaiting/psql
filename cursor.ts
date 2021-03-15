import {
    Connection
} from './connection.ts'





export class Cursor {
    constructor(public connection: Connection) {}
    execute() {}
}


export class ArrayCursor extends Cursor {
    constructor(public connection: Connection) {
        super(connection)
    }
}


export class ObjectCursor extends Cursor {
    constructor(public connection: Connection) {
        super(connection)
    }
}
