/**
 * Deno implementation of low level Postgresql frontend-backend protocol
 * https://www.postgresql.org/docs/13/protocol-message-formats.html
 */

import {
    MESSAGE_CODE,
    MESSAGE_NAME,
    AUTHENTICATION,
    ERROR_MESSAGE_FIELD,
    NOTICE_MESSAGE_FIELD
} from './const.ts'
import {
    BufferReader,
    BufferWriter,
    decode,
    encode
} from './buffer.ts'







// 
// message reader and writer
// 


// backend(B)/server --> frontend(F)/client
export class PacketReader {
    constructor(
        public name: MESSAGE_NAME, 
        public code: MESSAGE_CODE, 
        public length: number
    ) {}

    read(reader: BufferReader) {}
}

// frontend(F)/client --> backend(B)/server
export class PacketWriter {
    write(writer: BufferWriter) {}
}


export class AuthenticationReader extends PacketReader {

    read(reader: BufferReader) {
        const code = reader.readUint32()

        switch (code) {
            case AUTHENTICATION.Ok:
                this.name = MESSAGE_NAME.AuthenticationOk
                break

            case AUTHENTICATION.KerberosV5:
                this.name = MESSAGE_NAME.AuthenticationKerberosV5
                break

            case AUTHENTICATION.CleartextPassword:
                if (this.length === 8) {
                    this.name = MESSAGE_NAME.AuthenticationCleartextPassword
                }
                break

            case AUTHENTICATION.MD5Password:
                if (this.length === 12) {
                    this.name = MESSAGE_NAME.AuthenticationMD5Password
                    const salt = reader.read(4)
                    return {
                        name: this.name,
                        code: this.code,
                        length: this.length,
                        salt: salt
                    }
                }
                break

            case AUTHENTICATION.SCMCredential:
                this.name = MESSAGE_NAME.AuthenticationSCMCredential
                break

            case AUTHENTICATION.GSS:
                this.name = MESSAGE_NAME.AuthenticationGSS
                break

            case AUTHENTICATION.GSSContinue:
                this.name = MESSAGE_NAME.AuthenticationGSSContinue
                break

            case AUTHENTICATION.SSPI:
                this.name = MESSAGE_NAME.AuthenticationSSPI
                break

            case AUTHENTICATION.SASL: { // deno-lint no-case-declarations
                this.name = MESSAGE_NAME.AuthenticationSASL
                const mechanisms = []
                let mechanism: string
                do {
                    mechanism = reader.readSlice(0x00)
                    if (mechanism) {
                        mechanisms.push(mechanism)
                    }
                } while (mechanism)
                return {
                    name: this.name,
                    code: this.code,
                    length: this.length,
                    mechanisms: mechanisms
                }
                // with return statement, without break statement
            }

            case AUTHENTICATION.SASLContinue: { // deno-lint no-case-declarations
                this.name = MESSAGE_NAME.AuthenticationSASLContinue
                const data = reader.read(this.length - 8)
                return {
                    name: this.name,
                    code: this.code,
                    length: this.length,
                    data: data
                }
                // with return statement, without break statement
            }

            case AUTHENTICATION.SASLFinal: { // deno-lint no-case-declarations
                this.name = MESSAGE_NAME.AuthenticationSASLFinal
                const data = reader.read(this.length - 8)
                return {
                    name: this.name,
                    code: this.code,
                    length: this.length,
                    data: data
                }
                // with return statement, without break statement
            }

            default:
                throw new Error(`unknow authenticate message with ${code}`)
            
        }
    }
}

export class BindCompleteReader extends PacketReader {
    constructor() {
        super(
            /* name   */MESSAGE_NAME.BindComplete,
            /* code   */MESSAGE_CODE.BindComplete,
            /* length */5)
    }
}

export class CloseCompleteReader extends PacketReader {
    constructor() {
        super(
            /* name   */MESSAGE_NAME.CloseComplete,
            /* code   */MESSAGE_CODE.CloseComplete,
            /* length */5)
    }
}

export class CommandCompleteReader extends PacketReader {
    
    read(reader: BufferReader) {
        const data = reader.readSlice(0x00)
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            data: data
        }
    }
}

export class CopyDataReader extends PacketReader {

    read(reader: BufferReader) {
        const chunk = reader.read(this.length - 4)
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            chunk: chunk
        }
    }
}

export class CopyDoneReader extends PacketReader {
    constructor() {
        super(
            /* name   */MESSAGE_NAME.CopyDone,
            /* code   */MESSAGE_CODE.CopyDone,
            /* length */4)
    }
}

export class CopyInResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const mode = reader.readUint8() !== 0 // text | binary
        const count = reader.readUint16() // columnCount
        const types = []
        for (let index = 0; index < count; index++) {
            types[index] = reader.readUint16()
        }
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            mode: mode,
            count: count,
            types: types
        }
    }
}

export class CopyOutResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const mode = reader.readUint8() !== 0 // text | binary
        const count = reader.readUint16() // columnCount
        const types = []
        for (let index = 0; index < count; index++) {
            types[index] = reader.readUint16()
        }
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            mode: mode,
            count: count,
            types: types
        }
    }
}

export class CopyBothResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const mode = reader.readUint8() !== 0 // text | binary
        const count = reader.readUint16() // columnCount
        const types = []
        for (let index = 0; index < count; index++) {
            types[index] = reader.readUint16()
        }
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            mode: mode,
            count: count,
            types: types
        }
    }
}

export class DataRowReader extends PacketReader {

    read(reader: BufferReader) {
        const count = reader.readUint16() // fieldCount
        const fields = new Array(count)
        for (let index = 0; index < count; index++) {
            const length = reader.readUint32()
            fields[index] = length === -1 ? null : reader.readString(length)
        }
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            count: count,
            fields: fields
        }
    }
}

export class EmptyQueryResponseReader extends PacketReader {
    constructor() {
        super(
            /* name   */MESSAGE_NAME.EmptyQueryResponse,
            /* code   */MESSAGE_CODE.EmptyQueryResponse,
            /* length */4)
    }
}

export class ErrorResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const data: Record<string, string> = {}
        let name = reader.readString(1)
        while (name !== '\0') {
            data[name] = reader.readSlice(0x00)
            name = reader.readSlice(1)
        }
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            // error message field
            severity: data[ERROR_MESSAGE_FIELD.SEVERITY],
            errcode:  data[ERROR_MESSAGE_FIELD.CODE], // conflict with packet code's name
            message:  data[ERROR_MESSAGE_FIELD.MESSAGE],
            detail:   data[ERROR_MESSAGE_FIELD.DETAIL],
            hint:     data[ERROR_MESSAGE_FIELD.HINT],
            position: data[ERROR_MESSAGE_FIELD.POSITION],
            internalPosition: data[ERROR_MESSAGE_FIELD.INTERNAL_POSITION],
            internalQuery:    data[ERROR_MESSAGE_FIELD.INTERNAL_QUERY],
            where:      data[ERROR_MESSAGE_FIELD.WHERE],
            schema:     data[ERROR_MESSAGE_FIELD.SCHEMA],
            table:      data[ERROR_MESSAGE_FIELD.TABLE],
            column:     data[ERROR_MESSAGE_FIELD.COLUMN],
            dataType:   data[ERROR_MESSAGE_FIELD.DATA_TYPE],
            constraint: data[ERROR_MESSAGE_FIELD.CONSTRAINT],
            file:    data[ERROR_MESSAGE_FIELD.FILE],
            line:    data[ERROR_MESSAGE_FIELD.LINE],
            routine: data[ERROR_MESSAGE_FIELD.ROUTINE]
        }
    }
}