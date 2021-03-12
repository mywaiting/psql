/**
 * buffer reader/writer for postgresql buffer/data-types
 * https://www.postgresql.org/docs/13/protocol-message-types.html
 */



/**
 * ported from `deno/std/encoding/utf8.ts`
 * after deno/std/ v0.88.0, breaking change remove `ecoding/utf8.ts`
 * TextEncoder() only support utf-8 encording
 */
const encoder = new TextEncoder()
export function encode(input?: string): Uint8Array {
    return encoder.encode(input)
}

const decoder = new TextDecoder()
export function decode(input?: Uint8Array): string {
    return decoder.decode(input)
}


/**
 * reader for postgresql buffer reading
 * big endian buffer
 */
export class BufferReader {

    index = 0

    get length(): number {
        return this.index
    }

    constructor(readonly buffer: Uint8Array) {}

    read(length: number): Uint8Array {
        const buffer = this.buffer.slice(this.index, this.index + length)
        this.index += length
        return buffer
    }

    /**
     * this.readSlice(0x00) means null terminated string 
     */
    readSlice(delim: number): string {
        let end = this.buffer.indexOf(delim, this.index)
        if (end === -1) end = this.buffer.length
        const buffer = this.buffer.slice(this.index, end)
        this.index += buffer.length + 1
        return decode(buffer)
    }

    readString(length: number): string {
        const buffer = this.read(length)
        return decode(buffer)
    }

    readUints(length: number): number {
        let uints = 0
        for (let current = 0; current < length; current++) {
            // big endian buffer
            uints += this.buffer[this.index++] << (8 * current)
        }
        return uints
    }

    readUint8(): number {
        return this.buffer[this.index++]
        // return this.readUints(1)
    }

    readUint16(): number {
        return this.readUints(2)
    }

    readUint32(): number {
        return this.readUints(4)
    }

    readUint64(): number {
        return this.readUints(8)
    }

}


/**
 * writer for postgresql buffer writing
 * big endian buffer
 */
export class BufferWriter {

    index = 0

    get length(): number {
        return this.index
    }

    get capacity(): number {
        return this.buffer.length - this.index
    }

    constructor(readonly buffer: Uint8Array) {}

    write(buffer: Uint8Array): BufferWriter {
        if (buffer.length > this.capacity) {
            buffer = buffer.slice(0, this.capacity)
        }
        this.buffer.set(buffer, this.index)
        this.index += buffer.length
        return this
    }

    writeString(string: string): BufferWriter {
        const buffer = encode(string)
        this.buffer.set(buffer, this.index)
        this.index += buffer.length
        return this
    }

    writeUints(length: number, digit: number): BufferWriter {
        for (let current = 0; current < length; current++) {
            // big endian buffer
            this.buffer[this.index++] = (digit >> (current * 8)) & 0xff
        }
        return this
    }

    writeUint8(digit: number): BufferWriter {
        return this.writeUints(1, digit)
    }

    writeUint16(digit: number): BufferWriter {
        // this.buffer[this.index++] = (num >>> 8) & 0xff
        // this.buffer[this.index++] = (num >>> 0) & 0xff
        return this.writeUints(2, digit)
    }

    writeUint32(digit: number): BufferWriter {
        // this.buffer[this.index++] = (num >>> 24) & 0xff
        // this.buffer[this.index++] = (num >>> 16) & 0xff
        // this.buffer[this.index++] = (num >>> 8) & 0xff
        // this.buffer[this.index++] = (num >>> 0) & 0xff
        return this.writeUints(4, digit)
    }

    writeUint64(digit: number): BufferWriter {
        return this.writeUints(8, digit)
    }

}