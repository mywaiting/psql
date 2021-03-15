import {
    Connection
} from './connection.ts'





export class Cursor {
    constructor(connection: Connection) {}
    execute() {}
}


export class ArrayCursor extends Cursor {

}


export class ObjectCursor extends Cursor {

}
