/**
 * Deno implementation of low level Postgresql frontend-backend protocol
 * https://www.postgresql.org/docs/13/protocol-message-formats.html
 */

import {
    MESSAGE_CODE,
    MESSAGE_NAME,
    AUTHENTICATION_CODE,
    ERROR_MESSAGE,
    NOTICE_MESSAGE,
    PARAMETER_FORMAT_CODE,
    PORTAL_STATEMENT_TYPE,
    TRANSACTION_STATUS
} from './const.ts'
import {
    BufferReader,
    BufferWriter,
    decode,
    encode
} from './buffer.ts'
import {
    TypeWriter
} from './types.ts'


const DEBUG = false

/**
 * be careful pass reader: BuffferReader
 * please used BufReader.copy() before pass reader!
 */
export function dumpPacket(reader: BufferReader) {
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
        console.log(printUints.join(' ') + '    ' + printTexts)
        printUints = [], printTexts = ''
    }
}



// 
// packet reader
// 


// backend(B)/server --> frontend(F)/client
export class PacketReader {
    constructor(
        public packetName: MESSAGE_NAME, 
        public packetCode: MESSAGE_CODE, 
        public packetLength: number
    ) {}

    read(reader: BufferReader) {
        throw new Error('not implemented')
    }
}

export class AuthenticationReader extends PacketReader {

    read = (reader: BufferReader): {
        packetName: MESSAGE_NAME,
        packetCode: MESSAGE_CODE,
        packetLength: number
    // deno-lint-ignore no-explicit-any
    } & any => {
        // read authentication code for authenticate message
        const code = reader.readInt32() as AUTHENTICATION_CODE

        switch (code) {
            case AUTHENTICATION_CODE.Ok:
                this.packetName = MESSAGE_NAME.AuthenticationOk
                break

            case AUTHENTICATION_CODE.KerberosV5:
                this.packetName = MESSAGE_NAME.AuthenticationKerberosV5
                break

            case AUTHENTICATION_CODE.CleartextPassword:
                if (this.packetLength === 8) {
                    this.packetName = MESSAGE_NAME.AuthenticationCleartextPassword
                }
                break

            case AUTHENTICATION_CODE.MD5Password:
                if (this.packetLength === 12) {
                    this.packetName = MESSAGE_NAME.AuthenticationMD5Password
                    const salt: Uint8Array = reader.read(4)
                    return {
                        packetName: this.packetName,
                        packetCode: this.packetCode,
                        packetLength: this.packetLength,
                        salt: salt
                    }
                }
                break

            case AUTHENTICATION_CODE.SCMCredential:
                this.packetName = MESSAGE_NAME.AuthenticationSCMCredential
                break

            case AUTHENTICATION_CODE.GSS:
                this.packetName = MESSAGE_NAME.AuthenticationGSS
                break

            case AUTHENTICATION_CODE.GSSContinue: { // deno-lint no-case-declarations
                this.packetName = MESSAGE_NAME.AuthenticationGSSContinue
                // except Int32(packetLength) + Int32(AUTHENTICATION_CODE) = 8
                const data: Uint8Array = reader.read(this.packetLength - 8)
                return {
                    packetName: this.packetName,
                    packetCode: this.packetCode,
                    packetLength: this.packetLength,
                    data: data
                }
                // with return statement, without break statement
            }

            case AUTHENTICATION_CODE.SSPI:
                this.packetName = MESSAGE_NAME.AuthenticationSSPI
                break

            case AUTHENTICATION_CODE.SASL: { // deno-lint no-case-declarations
                this.packetName = MESSAGE_NAME.AuthenticationSASL
                const mechanisms = []
                let mechanism: string
                do {
                    mechanism = reader.readSlice(0x00)
                    if (mechanism) {
                        mechanisms.push(mechanism)
                    }
                } while (mechanism)
                return {
                    packetName: this.packetName,
                    packetCode: this.packetCode,
                    packetLength: this.packetLength,
                    mechanisms: mechanisms
                }
                // with return statement, without break statement
            }

            case AUTHENTICATION_CODE.SASLContinue: { // deno-lint no-case-declarations
                this.packetName = MESSAGE_NAME.AuthenticationSASLContinue
                // except Int32(packetLength) + Int32(AUTHENTICATION_CODE) = 8
                const data: Uint8Array = reader.read(this.packetLength - 8)
                return {
                    packetName: this.packetName,
                    packetCode: this.packetCode,
                    packetLength: this.packetLength,
                    data: data
                }
                // with return statement, without break statement
            }

            case AUTHENTICATION_CODE.SASLFinal: { // deno-lint no-case-declarations
                this.packetName = MESSAGE_NAME.AuthenticationSASLFinal
                // except Int32(packetLength) + Int32(AUTHENTICATION_CODE) = 8
                const data = reader.read(this.packetLength - 8)
                return {
                    packetName: this.packetName,
                    packetCode: this.packetCode,
                    packetLength: this.packetLength,
                    data: data
                }
                // with return statement, without break statement
            }

            default:
                throw new Error(`unknow authenticate message with ${code}`)
            
        }

        return this
    }
}

export class BackendKeyDataReader extends PacketReader {

    read(reader: BufferReader) {
        const processId = reader.readInt32()
        const secretKey = reader.readInt32()
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
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


const COMMAND_TAG_REGEXP = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/

export class CommandCompleteReader extends PacketReader {
    
    /**
     * CommandComplete returns:
     * For an INSERT command, the tag is INSERT oid rows, where rows is the number of rows inserted. oid used to be the object ID of the inserted row if rows was 1 and the target table had OIDs, but OIDs system columns are not supported anymore; therefore oid is always 0.
     * For a DELETE command, the tag is DELETE rows where rows is the number of rows deleted.
     * For an UPDATE command, the tag is UPDATE rows where rows is the number of rows updated.
     * For a SELECT or CREATE TABLE AS command, the tag is SELECT rows where rows is the number of rows retrieved.
     * For a MOVE command, the tag is MOVE rows where rows is the number of rows the cursor's position has been changed by.
     * For a FETCH command, the tag is FETCH rows where rows is the number of rows that have been retrieved from the cursor.
     * For a COPY command, the tag is COPY rows where rows is the number of rows copied. (Note: the row count appears only in PostgreSQL 8.2 and later.)
     */
    read(reader: BufferReader) {
        const commandTag = reader.readSlice(0x00)
        const metches = COMMAND_TAG_REGEXP.exec(commandTag)
        if (metches) {
            return {
                packetName: this.packetName,
                packetCode: this.packetCode,
                packetLength: this.packetLength,
                commandTag: commandTag,
                // INSERT | DELETE | UPDATE | DELECT | MOVE | FETCH | COPY
                command: metches[1],
                // metches[3] = command oid rows
                // metches[2] = command rows
                count: metches[3] ? parseInt(metches[3], 10) : parseInt(metches[2], 10)
            }
        } else {
            return {
                packetName: this.packetName,
                packetCode: this.packetCode,
                packetLength: this.packetLength,
                commandTag: commandTag
            }
        }
    }
}

export class CopyDataReader extends PacketReader {

    read(reader: BufferReader) {
        // except Int32(packetLength) + Int32(AUTHENTICATION_CODE) = 8
        const data: Uint8Array = reader.read(this.packetLength - 8)
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            data: data
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
        const format = reader.readInt8() as PARAMETER_FORMAT_CODE // 0x00 = 'text', 0x01 = 'binary'
        const count = reader.readInt16() // columns count
        const codes: PARAMETER_FORMAT_CODE[] = [] // the format codes to be used for each column
        for (let index = 0; index < count; index++) {
            codes[index] = reader.readInt16()
        }
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            format: format, // 0x00 = 'text', 0x01 = 'binary'
            count: count,   // columns count
            codes: codes    // each must presently be zero (text) or one (binary)
        }
    }
}

export class CopyOutResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const format = reader.readInt8() as PARAMETER_FORMAT_CODE // 0x00 = 'text', 0x01 = 'binary'
        const count = reader.readInt16() // columns count
        const codes: PARAMETER_FORMAT_CODE[] = [] // the format codes to be used for each column
        for (let index = 0; index < count; index++) {
            codes[index] = reader.readInt16()
        }
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            format: format, // 0x00 = 'text', 0x01 = 'binary'
            count: count,   // columns count
            codes: codes    // each must presently be zero (text) or one (binary)
        }
    }
}

export class CopyBothResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const format = reader.readInt8() as PARAMETER_FORMAT_CODE // 0x00 = 'text', 0x01 = 'binary'
        const count = reader.readInt16() // columns count
        const codes: PARAMETER_FORMAT_CODE[] = [] // the format codes to be used for each column
        for (let index = 0; index < count; index++) {
            codes[index] = reader.readInt16()
        }
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            format: format, // 0x00 = 'text', 0x01 = 'binary'
            count: count,   // columns count
            codes: codes    // each must presently be zero (text) or one (binary)
        }
    }
}

export class DataRowReader extends PacketReader {

    read(reader: BufferReader) {
        const count = reader.readInt16() // fields count
        const fields: (Uint8Array | null)[] = new Array(count)

        for (let index = 0; index < count; index++) {
            const length = reader.readInt32()
            fields[index] = length === -1 ? null : reader.read(length)
        }
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            count: count,   // fields count
            fields: fields  // fields Array(Uint8Array[])
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
            name = reader.readString(1)
        }
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            // error message
            severity         : data[ERROR_MESSAGE.SEVERITY],
            code             : data[ERROR_MESSAGE.CODE],
            message          : data[ERROR_MESSAGE.MESSAGE],
            detail           : data[ERROR_MESSAGE.DETAIL],
            hint             : data[ERROR_MESSAGE.HINT],
            position         : data[ERROR_MESSAGE.POSITION],
            internalPosition : data[ERROR_MESSAGE.INTERNAL_POSITION],
            internalQuery    : data[ERROR_MESSAGE.INTERNAL_QUERY],
            where            : data[ERROR_MESSAGE.WHERE],
            schema           : data[ERROR_MESSAGE.SCHEMA],
            table            : data[ERROR_MESSAGE.TABLE],
            column           : data[ERROR_MESSAGE.COLUMN],
            dataType         : data[ERROR_MESSAGE.DATA_TYPE],
            constraint       : data[ERROR_MESSAGE.CONSTRAINT],
            file             : data[ERROR_MESSAGE.FILE],
            line             : data[ERROR_MESSAGE.LINE],
            routine          : data[ERROR_MESSAGE.ROUTINE]
        }
    }
}

export class FunctionCallResponseReader extends PacketReader {

    read(reader: BufferReader) {
        /**
         * the length of the function result value, in bytes (this count does not include itself). 
         * can be zero. as a special case, -1 indicates a NULL function result. 
         * no value bytes follow in the NULL case.
         */
        const length = reader.readInt32()
        const result = length === -1 ? null : reader.read(length) 
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            length: length,
            result: result
        }
    }
}

export class NegotiateProtocolVersionReader extends PacketReader {

    read(reader: BufferReader) {
        // Newest minor protocol version supported by the server for 
        // the major protocol version requested by the client
        const newestVersion = reader.readInt32()
        const count = reader.readInt32()
        // for protocol option not recognized by the server, just option name
        const options: string[] = []
        for (let index = 0; index < count; index++) {
            options[index] = reader.readSlice(0x00)
        }
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            newestVersion: newestVersion,
            count: count,
            options: options
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
        const data: Record<string, string> = {}
        let name = reader.readString(1)
        while (name !== '\0') {
            data[name] = reader.readSlice(0x00)
            name = reader.readString(1)
        }
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            // notice message field
            severity         : data[NOTICE_MESSAGE.SEVERITY],
            code             : data[NOTICE_MESSAGE.CODE],
            message          : data[NOTICE_MESSAGE.MESSAGE],
            detail           : data[NOTICE_MESSAGE.DETAIL],
            hint             : data[NOTICE_MESSAGE.HINT],
            position         : data[NOTICE_MESSAGE.POSITION],
            internalPosition : data[NOTICE_MESSAGE.INTERNAL_POSITION],
            internalQuery    : data[NOTICE_MESSAGE.INTERNAL_QUERY],
            where            : data[NOTICE_MESSAGE.WHERE],
            schema           : data[NOTICE_MESSAGE.SCHEMA],
            table            : data[NOTICE_MESSAGE.TABLE],
            column           : data[NOTICE_MESSAGE.COLUMN],
            dataType         : data[NOTICE_MESSAGE.DATA_TYPE],
            constraint       : data[NOTICE_MESSAGE.CONSTRAINT],
            file             : data[NOTICE_MESSAGE.FILE],
            line             : data[NOTICE_MESSAGE.LINE],
            routine          : data[NOTICE_MESSAGE.ROUTINE]
        }
    }
}

export class NotificationResponseReader extends PacketReader {

    read(reader: BufferReader) {
        const processId = reader.readInt32()
        // the name of the channel that the notify has been raised on
        const channel = reader.readSlice(0x00)
        // the “payload” string passed from the notifying process
        const payload = reader.readSlice(0x00)
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            processId: processId,
            channel: channel,
            payload: payload
        }
    }
}

export class ParameterDescriptionReader extends PacketReader {

    read(reader: BufferReader) {
        // the number of parameters used by the statement (can be zero)
        const count = reader.readInt16()
        // specifies the object ID of the parameter data type
        const dataTypeIds = []
        for (let index = 0; index < count; index++) {
            dataTypeIds[index] = reader.readInt32()
        }
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            count: count,
            dataTypeIds: dataTypeIds
        }
    }
}

export class ParameterStatusReader extends PacketReader {

    read(reader: BufferReader) {
        // the name of the run-time parameter being reported.
        const name = reader.readSlice(0x00)
        // the current value of the parameter.
        const value = reader.readSlice(0x00)
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            name: name,
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
        /** 
         * current backend transaction status indicator. Possible values are: 
         * 0x49 = 73 = 'I' if idle (not in a transaction block); 
         * 0x54 = 84 = 'T' if in a transaction block; 
         * 0x45 = 69 = 'E' if in a failed transaction block (queries will be rejected until block is ended)
         */
        const transactionStatus = reader.readInt8() as TRANSACTION_STATUS
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            transactionStatus: transactionStatus
        }
    }
}

export class RowDescriptionReader extends PacketReader {

    readField(reader: BufferReader) {
        const name = reader.readSlice(0x00)
        const tableId = reader.readInt32()
        const columnId = reader.readInt16()
        const dataTypeId = reader.readInt32()
        const dataTypeSize = reader.readInt16()
        const dataTypeModifier = reader.readInt32()
        const format = reader.readInt16() as PARAMETER_FORMAT_CODE // 0x00 = 'text', 0x01 = 'binary'
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
        // specifies the number of fields in a row (can be zero)
        const count = reader.readInt16()
        const fields = new Array(count)
        for (let index = 0; index < count; index++) {
            fields[index] = this.readField(reader)
        }
        return {
            packetName: this.packetName,
            packetCode: this.packetCode,
            packetLength: this.packetLength,
            count: count,
            fields: fields
        }
    }
}



// 
// packet writer
// 


// frontend(F)/client --> backend(B)/server
export class PacketWriter {
    constructor(
        public packetName: MESSAGE_NAME, 
        public packetCode: MESSAGE_CODE, 
        public packetLength: number
    ) {}

    write(writer: BufferWriter): Uint8Array {
        throw new Error('not implemented')
    }

    /**
     * !!!call this last after all other packet build flows!!!
     * 
     * almost all case, `buffer` pass to BufferWriter known its length
     * so here just except BYTE1(packetCode) + Int32(packetLength) = 5
     */
    writeHeader(writer: BufferWriter) {
        // restore current body buffer
        const bodyLength = writer.index
        const bodyBuffer = writer.buffer.slice(0, bodyLength)
        // packetLength
        this.packetLength = bodyLength + 4
        // rebuild the packet
        writer.enlarge(5)
        writer.index = 0
        // set BYTE1(packetCode) + Int32(packetLength) = 5
        writer.writeUint8(this.packetCode)   // Byte1() = 1 byte
        writer.writeInt32(this.packetLength) // Int32() = 4 byte
        // rewrite body buffer
        writer.write(bodyBuffer)
        writer.index = bodyLength + 5
    }
}


const typeWriter = new TypeWriter()

export class BindWriter extends PacketWriter {
    constructor(
        public portal?: string,
        public statement?: string,
        public values?: unknown[],
        public valueMapper?: (value: unknown) => null | string | Uint8Array
    ) {
        super(
            /* name */MESSAGE_NAME.Bind,
            /* code */MESSAGE_CODE.Bind,
            /* length */1024 // min buffer length by guess 512
        )
        // valueMapper default as TypeWriter.encode
        this.valueMapper = valueMapper ? valueMapper : typeWriter.encode
    }

    write(writer: BufferWriter) {
        const portal = this.portal || '' // an empty string selects the unnamed portal
        const statement = this.statement || '' // an empty string selects the unnamed prepared statement
        const values = this.values || []
        // check Uint8Array exists,
        const hasBinaryValues = values.some((value) => value instanceof Uint8Array)

        writer.writeString(portal).writeUint8(0x00) // portal name, c string
        writer.writeString(statement).writeUint8(0x00) // statement name, c string

        // the number of parameter format codes that follow
        if (hasBinaryValues) {
            writer.writeInt16(values.length)
            values.forEach((value) => {
                writer.writeInt16(value instanceof Uint8Array 
                    ? PARAMETER_FORMAT_CODE.BINARY 
                    : PARAMETER_FORMAT_CODE.TEXT
                )
            })
        } else {
            writer.writeInt16(0x00)
        }
        // this must match the number of parameters needed by the query
        writer.writeInt16(values.length)
        // the following pair of fields appear for each parameter
        values.forEach((value) => {
            const mappedValue = this.valueMapper!(value)
            // as `null`
            if (mappedValue === null || typeof mappedValue === 'undefined') {
                writer.writeInt32(-1)
            // as `unit8array
            } else if (mappedValue instanceof Uint8Array) {
                writer.writeInt32(mappedValue.length)
                writer.write(mappedValue)
            // as `string`
            } else {
                const byteLength = encode(mappedValue).length
                writer.writeInt32(byteLength)
                writer.writeString(mappedValue)
            }
        })
        /**
         * the number of result-column format codes that follow (denoted R below). 
         * this can be zero to indicate that there are no result columns 
         * or that the result columns should all use the default format (text); 
         * or one, in which case the specified format code is applied to all result columns (if any); 
         * or it can equal the actual number of result columns of the query.
         */
        writer.writeInt16(0x00)
        
        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

/**
 * cancelRequest without packetCode that is not a standard postgres packet.
 * so here, can not extends from PacketWriter, just a single alone class.
 */
export class CancelRequestWriter {

    packetName: MESSAGE_NAME = MESSAGE_NAME.CancelRequest
    // packetCode: MESSAGE_CODE = '' // cancelRequest without packetCode
    packetLength = 0x10 // parseInt(packetLength, 10) = 16

    constructor(
        public processId: number,
        public secretKey: number
    ) {}

    write(writer: BufferWriter): Uint8Array {
        writer.writeInt16(this.packetLength)
        /**
         * the cancel request code. The value is chosen to 
         * contain 1234 in the most significant 16 bits, 
         * and 5678 in the least significant 16 bits
         */
        writer.writeInt32(80877102)
        writer.writeInt32(this.processId)
        writer.writeInt32(this.secretKey)
        return writer.buffer.slice(0, writer.index)
    }
}

export class CloseWriter extends PacketWriter {
    constructor(
        public type: PORTAL_STATEMENT_TYPE,
        public name: string = ''
    ) {
        super(
            /* name */MESSAGE_NAME.Close,
            /* code */MESSAGE_CODE.Close,
            /* length */name.length + 2 // name.length + 0x00 + BYTE1(type)
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint8(this.type)
        writer.writeString(this.name).writeUint8(0x00)

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class CopyDataWriter extends PacketWriter {
    constructor(
        public data: Uint8Array
    ) {
        super(
            /* name */MESSAGE_NAME.CopyData,
            /* code */MESSAGE_CODE.CopyData,
            /* length */data.length
        )
    }

    write(writer: BufferWriter) {
        writer.write(this.data)

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class CopyDoneWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.CopyDone,
            /* code */MESSAGE_CODE.CopyDone,
            /* length */0// code + length
        )
    }

    write(writer: BufferWriter) {
        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
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
            /* length */message.length
        )
    }

    write(writer: BufferWriter) {
        writer.writeString(this.message).writeUint8(0x00)
        
        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class DescribeWriter extends PacketWriter {
    constructor(
        public type: PORTAL_STATEMENT_TYPE,
        public name: string = ''
    ) {
        super(
            /* name */MESSAGE_NAME.Describe,
            /* code */MESSAGE_CODE.Describe,
            /* length */name.length + 2 // name.length + 0x00 + BYTE1(type)
        )
    }

    write(writer: BufferWriter) {
        writer.writeUint8(this.type)
        writer.writeString(this.name).writeUint8(0x00)

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class ExecuteWriter extends PacketWriter {
    constructor(
        public portal: string = '',
        public rows: number = 0
    ) {
        super(
            /* name */MESSAGE_NAME.Execute,
            /* code */MESSAGE_CODE.Execute,
            /* length */portal.length + 4
        )
    }

    write(writer: BufferWriter) {
        writer.writeString(this.portal).writeUint8(0x00)
        writer.writeInt32(this.rows)

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class FlushWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.Flush,
            /* code */MESSAGE_CODE.Flush,
            /* length */0
        )
    }

    write(writer: BufferWriter) {
        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

// TODO: waiting to complete the code
export class FunctionCallWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.FunctionCall,
            /* code */MESSAGE_CODE.FunctionCall,
            /* length */0
        )
    }

    write(writer: BufferWriter) {
        return writer.buffer.slice(0, writer.index)
    }
}

export class GSSResponseWriter extends PacketWriter {
    constructor(
        public data: Uint8Array
    ) {
        super(
            /* name */MESSAGE_NAME.GSSResponse,
            /* code */MESSAGE_CODE.GSSResponse,
            /* length */data.length
        )
    }

    write(writer: BufferWriter) {
        writer.write(this.data)

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class ParseWriter extends PacketWriter {
    constructor(
        public statement: string = '', // an empty string selects the unnamed prepared statement
        public query: string, 
    ) {
        super(
            /* name */MESSAGE_NAME.Parse,
            /* code */MESSAGE_CODE.Parse,
            /* length */statement.length + 1 + query.length + 1 + 2
        )
    }

    write(writer: BufferWriter) {
        writer.writeString(this.statement).writeUint8(0x00)
        writer.writeString(this.query).writeUint8(0x00)
        /**
         * the number of parameter data types specified (can be zero). 
         * note that this is not an indication of the number of parameters 
         * that might appear in the query string, only the number that 
         * the frontend wants to prespecify types for.
         */
        writer.writeInt16(0x00)

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class PasswordMessageWriter extends PacketWriter {
    constructor(
        public password: string = ''
    ) {
        super(
            /* name */MESSAGE_NAME.PasswordMessage,
            /* code */MESSAGE_CODE.PasswordMessage,
            /* length */password.length + 1
        )
    }

    write(writer: BufferWriter) {
        writer.writeString(this.password).writeUint8(0x00)

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
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
            /* length */query.length + 1
        )
    }

    write(writer: BufferWriter) {
        writer.writeString(this.query).writeUint8(0x00)

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class SASLInitialResponseWriter extends PacketWriter {
    constructor(
        public mechanism: string = '',
        public initialResponse?: Uint8Array

    ) {
        super(
            /* name */MESSAGE_NAME.SASLInitialResponse,
            /* code */MESSAGE_CODE.SASLInitialResponse,
            /* length */mechanism.length + 1 + 4 + (initialResponse ? initialResponse.length : 0)
        )
    }

    write(writer: BufferWriter) {
        writer.writeString(this.mechanism).writeUint8(0x00)
        // with initialResponse
        if (this.initialResponse) {
            writer.writeInt32(this.initialResponse.length)
            writer.write(this.initialResponse)
        // without initialResponse
        } else {
            writer.writeInt32(-1)
        }

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class SASLResponseWriter extends PacketWriter {
    constructor(
        public data: Uint8Array
    ) {
        super(
            /* name */MESSAGE_NAME.SASLResponse,
            /* code */MESSAGE_CODE.SASLResponse,
            /* length */data.length
        )
    }

    write(writer: BufferWriter) {
        writer.write(this.data)

        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

/**
 * SSLRequest has no initial message-type byte.
 * https://www.postgresql.org/docs/13/protocol-message-formats.html#SSLRequest
 * 
 * sslRequest without packetCode that is not a standard postgres packet.
 * so here, can not extends from PacketWriter, just a single alone class.
 */
export class SSLRequestWriter {
    
    packetName: MESSAGE_NAME = MESSAGE_NAME.SSLRequest
    // packetCode: MESSAGE_CODE = '' // sslRequest without packetCode
    packetLength = 0x10 // parseInt(packetLength, 10) = 16

    write(writer: BufferWriter) {
        writer.writeInt16(this.packetLength)
        /**
         * the SSL request code. The value is chosen to contain 1234 in the most significant 16 bits, 
         * and 5679 in the least significant 16 bits. (To avoid confusion, 
         * this code must not be the same as any protocol version number.)
         */
        writer.writeInt32(80877103)
        return writer.buffer.slice(0, writer.index)
    }
}

/**
 * GSSENCRequest has no initial message-type byte.
 * https://www.postgresql.org/docs/13/protocol-message-formats.html#GSSENCRequest
 * 
 * gssencRequest without packetCode that is not a standard postgres packet.
 * so here, can not extends from PacketWriter, just a single alone class.
 */
export class GSSENCRequestWriter {
    
    packetName: MESSAGE_NAME = MESSAGE_NAME.GSSENCRequest
    // packetCode: MESSAGE_CODE = '' // gssencRequest without packetCode
    packetLength = 0x10 // parseInt(packetLength, 10) = 16

    write(writer: BufferWriter) {
        writer.writeInt16(this.packetLength)
        /**
         * the GSSAPI Encryption request code. The value is chosen to contain 1234 in the most significant 16 bits, 
         * and 5680 in the least significant 16 bits. (To avoid confusion, 
         * this code must not be the same as any protocol version number.)
         */
        writer.writeInt32(80877104)
        return writer.buffer.slice(0, writer.index)
    }
}

/**
 * for historical reasons, the very first message sent by the client 
 * (the startup message) has no initial message-type byte.
 * https://www.postgresql.org/docs/13/protocol-overview.html#PROTOCOL-MESSAGE-CONCEPTS
 * 
 * startup without packetCode that is not a standard postgres packet.
 * so here, can not extends from PacketWriter, just a single alone class.
 */
export class StartupWriter {
    
    packetName: MESSAGE_NAME = MESSAGE_NAME.StartupMessage
    // packetCode: MESSAGE_CODE = '' // gssencRequest without packetCode
    packetLength = 0x00 // unknown packetLength, default is zero

    constructor(
        public user: string = '',
        public database?: string,
        public applicationName: string = 'pq',
        public clientEncoding: string = 'utf-8'
    ) {}

    write(writer: BufferWriter) {
        // packetLength setted to zero, and modified after all
        writer.writeInt32(0x00)
        /**
         * the protocol version number. current is 3.0 = 196608(BE)
         * the most significant 16 bits are the major version number (3 for the protocol described here). 
         * the least significant 16 bits are the minor version number (0 for the protocol described here).
         */
        // writer.writeInt16(0x03).writeInt16(0x00)
        writer.writeInt32(196608)
        // user
        writer.writeString('user').writeUint8(0x00)
        writer.writeString(this.user).writeUint8(0x00)
        // database, default to the user name
        writer.writeString('database').writeUint8(0x00)
        writer.writeString(this.database ?? this.user).writeUint8(0x00)
        // application_name
        writer.writeString('application_name').writeUint8(0x00)
        writer.writeString(this.applicationName).writeUint8(0x00)
        // client_encoding
        writer.writeString('client_encoding').writeUint8(0x00)
        writer.writeString(this.clientEncoding).writeUint8(0x00)
        // terminator with empty
        writer.writeString('').writeUint8(0x00)

        // reset current packetLength
        this.packetLength = writer.index
        writer.index = 0
        writer.writeInt32(this.packetLength)
        writer.index = this.packetLength

        return writer.buffer.slice(0, writer.index)
    }
}

export class SyncWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.Sync,
            /* code */MESSAGE_CODE.Sync,
            /* length */0
        )
    }

    write(writer: BufferWriter) {
        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}

export class TerminateWriter extends PacketWriter {
    constructor() {
        super(
            /* name */MESSAGE_NAME.Terminate,
            /* code */MESSAGE_CODE.Terminate,
            /* length */0
        )
    }

    write(writer: BufferWriter) {
        // !!!call this last after all other packet build flows!!!
        this.writeHeader(writer)
        return writer.buffer.slice(0, writer.index)
    }
}