/**
 * Deno implementation of low level Postgresql frontend-backend protocol
 * https://www.postgresql.org/docs/13/protocol-message-formats.html
 */

import {
    MESSAGE_CODE,
    MESSAGE_NAME
} from './const.ts'
import {
    BufferReader,
    BufferWriter,
    decode,
    encode
} from './buffer.ts'










// backend(B)/server --> frontend(F)/client
export class PacketReader {
    name!: string
    code!: number
    length!: number
    body!: BufferReader

}

// frontend(F)/client --> backend(B)/server
export class PacketWriter {

}



export class AuthenticationReader extends PacketReader {

    read(reader: BufferReader) {
        this.name = MESSAGE_NAME.AuthenticationOk
        this.code = reader.readUint32()
    }
}