/**
 * Deno implementation of low level Postgresql frontend-backend protocol
 * https://www.postgresql.org/docs/13/protocol-message-formats.html
 */

import {
    BufferReader,
    BufferWriter,
    decode,
    encode
} from './buffer.ts'



// backend(B) --> frontend(F) // server --> client
export class MessageReader {
    name!: string
    type!: number
    length!: number
    body!: BufferReader

    async read(reader: Deno.Conn): Promise<MessageReader | null> {
        return this
    }
}

// frontend(F) --> backend(B) // client --> server
export class MessageWriter {

}



export class AuthenticationOkReader extends MessageReader {

}