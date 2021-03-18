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


const DEBUG = false

/**
 * be careful pass reader: BuffferReader
 * please used BufReader.copy() before pass reader!
 */
function dumpPacket(reader: BufferReader) {
    function printable(digit: number): string {
        if (32 <= digit && digit < 127) {
            return String.fromCharCode(digit)
        }
        return '.'
    }
    console.log(`packetLength: ${reader.buffer.length}`)
    // packet detail
    let printUints = [], printTexts = ''
    while (!reader.ended) {
        for (let current = 0; current < 16; current++) {
            if (reader.ended) return
            const int = reader.readUint8(), hex = Number(int).toString(16)
            printUints.push(hex.length === 1 ? ['0', hex].join('') : hex) 
            if (current === 7) printUints.push('  ')
            printTexts += printable(int)
        }
        console.log(printUints.join(' '), '    ', printTexts)
        printUints = [], printTexts = ''
    }
}



// 
// packet reader
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

export class BackendKeyDataReader extends PacketReader {

    read(reader: BufferReader) {
        const processId = reader.readUint32()
        const secretKey = reader.readUint32()
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            processId: processId,
            secretKey: secretKey
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
        const format = reader.readUint8() !== 0
        const count = reader.readUint16() // columnCount
        const types = []
        for (let index = 0; index < count; index++) {
            types[index] = reader.readUint16()
        }
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            format: format,
            count: count,
            types: types
        }
    }
}

export class CopyOutResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const format = reader.readUint8() !== 0
        const count = reader.readUint16() // columnCount
        const types = []
        for (let index = 0; index < count; index++) {
            types[index] = reader.readUint16()
        }
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            format: format,
            count: count,
            types: types
        }
    }
}

export class CopyBothResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const format = reader.readUint8() !== 0
        const count = reader.readUint16() // columnCount
        const types = []
        for (let index = 0; index < count; index++) {
            types[index] = reader.readUint16()
        }
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            format: format,
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
        this.name = MESSAGE_NAME.ErrorResponse
        const data: Record<string, string> = {}
        let name = reader.readString(1)
        while (name !== '\0') {
            data[name] = reader.readSlice(0x00)
            name = reader.readString(1)
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

export class FunctionCallResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const count = reader.readUint32()
        const result = count === -1 ? null : reader.readString(count) 
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            count: count,
            result: result
        }
    }
}

export class NoDataReader extends PacketReader {
    constructor() {
        super(
            /* name   */MESSAGE_NAME.NoData,
            /* code   */MESSAGE_CODE.NoData,
            /* length */5)
    }
}

export class NoticeResponseReader extends PacketReader {

    read(reader: BufferReader) {
        this.name = MESSAGE_NAME.NoticeResponse
        const data: Record<string, string> = {}
        let name = reader.readString(1)
        while (name !== '\0') {
            data[name] = reader.readSlice(0x00)
            name = reader.readString(1)
        }
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            // error message field
            severity: data[NOTICE_MESSAGE_FIELD.SEVERITY],
            errcode:  data[NOTICE_MESSAGE_FIELD.CODE], // conflict with packet code's name
            message:  data[NOTICE_MESSAGE_FIELD.MESSAGE],
            detail:   data[NOTICE_MESSAGE_FIELD.DETAIL],
            hint:     data[NOTICE_MESSAGE_FIELD.HINT],
            position: data[NOTICE_MESSAGE_FIELD.POSITION],
            internalPosition: data[NOTICE_MESSAGE_FIELD.INTERNAL_POSITION],
            internalQuery:    data[NOTICE_MESSAGE_FIELD.INTERNAL_QUERY],
            where:      data[NOTICE_MESSAGE_FIELD.WHERE],
            schema:     data[NOTICE_MESSAGE_FIELD.SCHEMA],
            table:      data[NOTICE_MESSAGE_FIELD.TABLE],
            column:     data[NOTICE_MESSAGE_FIELD.COLUMN],
            dataType:   data[NOTICE_MESSAGE_FIELD.DATA_TYPE],
            constraint: data[NOTICE_MESSAGE_FIELD.CONSTRAINT],
            file:    data[NOTICE_MESSAGE_FIELD.FILE],
            line:    data[NOTICE_MESSAGE_FIELD.LINE],
            routine: data[NOTICE_MESSAGE_FIELD.ROUTINE]
        }
    }
}

export class NotificationResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const process = reader.readUint32()
        const channel = reader.readSlice(0x00)
        const payload = reader.readSlice(0x00)
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            process: process,
            channel: channel,
            payload: payload
        }
    }
}

export class ParameterDescriptionReader extends PacketReader {

    // not used now, but implements for future
    read(reader: BufferReader) {

    }
}

export class ParameterStatusReader extends PacketReader {

    read(reader: BufferReader) {
        const parameter = reader.readSlice(0x00)
        const value = reader.readSlice(0x00)
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            parameter: parameter,
            value: value
        }
    }
}

export class ParseCompleteReader extends PacketReader {
    constructor() {
        super(
            /* name   */MESSAGE_NAME.ParseComplete,
            /* code   */MESSAGE_CODE.ParseComplete,
            /* length */5)
    }
}

export class PortalSuspendedReader extends PacketReader {
    constructor() {
        super(
            /* name   */MESSAGE_NAME.PortalSuspended,
            /* code   */MESSAGE_CODE.PortalSuspended,
            /* length */5)
    }
}

export class ReadyForQueryReader extends PacketReader {

    read(reader: BufferReader) {
        const status = reader.readString(1)
        return {
            name: this.name,
            code: this.code,
            length: this.length,
            status: status
        }
    }
}

export class RowDescriptionReader extends PacketReader {

    readField = (reader: BufferReader): {
        name: string,
        tableId: number,
        columnId: number,
        dataTypeId: number,
        dataTypeSize: number,
        dataTypeModifier: number,
        format: number // 0 = 'text', 1 = 'text'
    } => {
        const name = reader.readSlice(0x00)
        const tableId = reader.readUint32()
        const columnId = reader.readUint16()
        const dataTypeId = reader.readUint32()
        const dataTypeSize = reader.readUint16()
        const dataTypeModifier = reader.readUint32()
        const format = reader.readUint16() // 0 = 'text', 1 = 'text'
        return {
            name: name,
            tableId: tableId,
            columnId: columnId,
            dataTypeId: dataTypeId,
            dataTypeSize: dataTypeSize,
            dataTypeModifier: dataTypeModifier,
            format: format
        }
    }

    read(reader: BufferReader) {
        const count = reader.readUint16()
        const fields = new Array(count)
        for (let index = 0; index < count; index++) {
            fields[index] = this.readField(reader)
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



// 
// packet reader
// 


// frontend(F)/client --> backend(B)/server
export class PacketWriter {
    constructor(
        public name: MESSAGE_NAME, 
        public code: MESSAGE_CODE,
        public length: number
    ) {}

    write(writer: BufferWriter): Uint8Array {
        throw new Error('not implemented')
    }
}

export class BindWriter extends PacketWriter {
    constructor(
        public portal?: string,
        public statement?: string,
        public binary?: boolean,
        // deno-lint-ignore no-explicit-any
        public values?: any[],
        // deno-lint-ignore no-explicit-any
        public valueMapper?: (param: any, index: number) => any
    ) {
        super(
            /* name */MESSAGE_NAME.Bind,
            /* code */MESSAGE_CODE.Bind,
            /* length */512 // min buffer length by guess 512
        )
    }

    write(writer: BufferWriter) {
        return writer.buffer.slice(0, writer.index)
    }
}

export class CancelRequestWriter extends PacketWriter {

}

export class CloseWriter extends PacketWriter {
    constructor(
        public action: 'S' | 'P',
        public dialog?: string
    ) {
        super(
            /* name */MESSAGE_NAME.Close,
            /* code */MESSAGE_CODE.Close,
            /* length */(dialog || '').length + 1 + 4 + 1 // code + length + 0x00
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        writer.writeString(this.dialog || '').writeUint16(0x00)
        return writer.buffer.slice(0, writer.index)
    }
}

export class CopyDataWriter extends PacketWriter {
    constructor(
        public chunk: Uint8Array
    ) {
        super(
            /* name */MESSAGE_NAME.CopyData,
            /* code */MESSAGE_CODE.CopyData,
            /* length */chunk.length + 1 + 4// code + length
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        writer.write(this.chunk)
        return writer.buffer.slice(0, writer.index)
    }
}

export class CopyDoneWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.CopyDone,
            /* code */MESSAGE_CODE.CopyDone,
            /* length */1 + 4// code + length
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        return writer.buffer.slice(0, writer.index)
    }
}

export class CopyFailWriter extends PacketWriter {
    constructor(
        public message: string
    ) {
        super(
            /* name */MESSAGE_NAME.CopyFail,
            /* code */MESSAGE_CODE.CopyFail,
            /* length */message.length + 1 + 4// code + length
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        writer.writeString(this.message).writeUint16(0x00)
        return writer.buffer.slice(0, writer.index)
    }
}

export class DescribeWriter extends PacketWriter {
    constructor(
        public action: 'S' | 'P',
        public dialog?: string
    ) {
        super(
            /* name */MESSAGE_NAME.Describe,
            /* code */MESSAGE_CODE.Describe,
            /* length */(dialog || '').length + 1 + 4 + 1 // code + length + 0x00
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        writer.writeString(this.dialog || '').writeUint16(0x00)
        return writer.buffer.slice(0, writer.index)
    }
}

export class ExecuteWriter extends PacketWriter {
    constructor(
        public portal?: string,
        public rows?: number
    ) {
        super(
            /* name */MESSAGE_NAME.Flush,
            /* code */MESSAGE_CODE.Flush,
            /* length */1 + 4// code + length
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        return writer.buffer.slice(0, writer.index)
    }
}

export class FlushWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.Flush,
            /* code */MESSAGE_CODE.Flush,
            /* length */1 + 4// code + length
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        return writer.buffer.slice(0, writer.index)
    }
}

export class FunctionCallWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.FunctionCall,
            /* code */MESSAGE_CODE.FunctionCall,
            /* length */1 + 4// code + length
        )
    }

    write(writer: BufferWriter) {
        return writer.buffer.slice(0, writer.index)
    }
}

export class GSSResponseWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.GSSResponse,
            /* code */MESSAGE_CODE.GSSResponse,
            /* length */1 + 4// code + length
        )
    }

    write(writer: BufferWriter) {
        return writer.buffer.slice(0, writer.index)
    }
}

export class ParseWriter extends PacketWriter {
    constructor(
        public query: string,
        public qname: string,
        public types?: number[],
        
    ) {
        super(
            /* name */MESSAGE_NAME.Describe,
            /* code */MESSAGE_CODE.Describe,
            /* length */(dialog || '').length + 1 + 4 + 1 // code + length + 0x00
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        writer.writeString(this.dialog || '').writeUint16(0x00)
        return writer.buffer.slice(0, writer.index)
    }
}

export class PasswordMessageWriter extends PacketWriter {
    constructor(
        public password: string
    ) {
        super(
            /* name */MESSAGE_NAME.PasswordMessage,
            /* code */MESSAGE_CODE.PasswordMessage,
            /* length */password.length + 1 + 4 + 1 // code + length + 0x00
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        writer.writeString(this.password).writeUint16(0x00)
        return writer.buffer.slice(0, writer.index)
    }
}

export class QueryWriter extends PacketWriter {
    constructor(
        public query: string
    ) {
        super(
            /* name */MESSAGE_NAME.Query,
            /* code */MESSAGE_CODE.Query,
            /* length */query.length + 1 + 4 + 1 // code + length + 0x00
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        writer.writeString(this.query).writeUint16(0x00)
        return writer.buffer.slice(0, writer.index)
    }
}

export class SASLInitialResponseWriter extends PacketWriter {
    constructor(
        public mechanism: string,
        public initialResponse: string

    ) {
        super(
            /* name */MESSAGE_NAME.SASLInitialResponse,
            /* code */MESSAGE_CODE.SASLInitialResponse,
            /* length */mechanism.length + initialResponse.length + 1 + 4 + 1 // code + length + 0x00
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        writer.writeString(this.mechanism).writeUint16(0x00)
        writer.writeUint32(this.initialResponse.length)
        writer.writeString(this.initialResponse).writeUint16(0x00)
        return writer.buffer.slice(0, writer.index)
    }
}

export class SASLResponseWriter extends PacketWriter {
    constructor(
        public mechanism: string
    ) {
        super(
            /* name */MESSAGE_NAME.SASLResponse,
            /* code */MESSAGE_CODE.SASLResponse,
            /* length */mechanism.length + 1 + 4 + 1 // code + length + 0x00
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        writer.writeString(this.mechanism).writeUint16(0x00)
        return writer.buffer.slice(0, writer.index)
    }
}

/**
 * SSLRequest has no initial message-type byte.
 * https://www.postgresql.org/docs/13/protocol-message-formats.html#SSLRequest
 */
export class SSLRequestWriter {
    name = MESSAGE_NAME.SSLRequest
    /* code *///code = MESSAGE_CODE.SSLRequest
    length = 8 // 4 + 4

    write(writer: BufferWriter) {
        writer.writeUint32(this.length)
        writer.writeUint32(80877103)
        return writer.buffer.slice(0, writer.index)
    }
}

/**
 * GSSENCRequest has no initial message-type byte.
 * https://www.postgresql.org/docs/13/protocol-message-formats.html#GSSENCRequest
 */
export class GSSENCRequestWriter {
    name = MESSAGE_NAME.GSSENCRequest
    /* code *///code = MESSAGE_CODE.GSSENCRequest
    length = 8 // 4 + 4

    write(writer: BufferWriter) {
        writer.writeUint32(this.length)
        writer.writeUint32(80877104)
        return writer.buffer.slice(0, writer.index)
    }
}

/**
 * for historical reasons, the very first message sent by the client 
 * (the startup message) has no initial message-type byte.
 * https://www.postgresql.org/docs/13/protocol-overview.html#PROTOCOL-MESSAGE-CONCEPTS
 * so here, can not extends from PacketWriter, just a single alone class.
 */
export class StartupWriter {
    name = MESSAGE_NAME.StartupMessage
    /* code *///code = MESSAGE_CODE.StartupMessage

    constructor(options: Record<string, string>) {

    }

    write(writer: BufferWriter) {
        return writer.buffer.slice(0, writer.index)
    }
}

export class SyncWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.Sync,
            /* code */MESSAGE_CODE.Sync,
            /* length */1 + 4// code + length
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        return writer.buffer.slice(0, writer.index)
    }
}

export class TerminateWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.Terminate,
            /* code */MESSAGE_CODE.Terminate,
            /* length */1 + 4// code + length
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint16(this.code)
        writer.writeUint32(this.length)
        return writer.buffer.slice(0, writer.index)
    }
}