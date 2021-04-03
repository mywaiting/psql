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
 * big endian and little endian transformer
 * for int8/int16/int32/uint8/uint16/uint32
 */
export function readInt8BE(buffer: Uint8Array, offset: number): number {
    // https://blog.vjeux.com/2013/javascript/conversion-from-uint8-to-int8-x-24.html
    return buffer[offset] << 24 >> 24
}

export function readInt16BE(buffer: Uint8Array, offset: number): number {
    offset = offset >>> 0 // to uint32
    const value = buffer[offset + 1] | (buffer[offset] << 8)
    return value & 0x8000 ? value | 0xffff0000 : value
}

export function readInt32BE(buffer: Uint8Array, offset: number): number {
    offset = offset >>> 0
    return (
        (buffer[offset] << 24) |
        (buffer[offset + 1] << 16) |
        (buffer[offset + 2] << 8) |
        (buffer[offset + 3])
    )
}

export function readUint8BE(buffer: Uint8Array, offset: number): number {
    return buffer[offset]
}

export function readUint16BE(buffer: Uint8Array, offset: number): number {
    offset = offset >>> 0
    return buffer[offset] | (buffer[offset + 1] << 8)
}

export function readUint32BE(buffer: Uint8Array, offset: number): number {
    offset = offset >>> 0
    return (
        buffer[offset] * 0x1000000 + 
        (
            (buffer[offset + 1] << 16) |
            (buffer[offset + 2] << 8) |
            (buffer[offset + 3])
        )
    )
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

    get ended(): boolean {
        return this.index > this.buffer.length
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

    readInt8(): number {
        const value = readInt8BE(this.buffer, this.index)
        this.index += 1
        return value
    }

    readInt16(): number {
        const value = readInt16BE(this.buffer, this.index)
        this.index += 2
        return value
    }

    readInt32(): number {
        const value = readInt32BE(this.buffer, this.index)
        this.index += 4
        return value
    }

    readUint8(): number {
        const value = readUint8BE(this.buffer, this.index)
        this.index += 1
        return value
    }

    readUint16(): number {
        const value = readUint16BE(this.buffer, this.index)
        this.index += 2
        return value
    }

    readUint32(): number {
        const value = readUint32BE(this.buffer, this.index)
        this.index += 4
        return value
    }

}


/**
 * writer for postgresql buffer writing
 * big endian buffer
 */
export class BufferWriter {

    index = 0

    constructor(public buffer: Uint8Array) {}

    /**
     * enlarge current buffer with more length
     */
    enlarge(length: number): BufferWriter {
        const remainLength = this.buffer.length - this.index
        if (remainLength < length) {
            const buffer = this.buffer
            // enlarge factor ~= 1.5 
            // https://stackoverflow.com/questions/2269063/buffer-growth-strategy
            const newestLength = buffer.length + (buffer.length >> 1) + length
            this.buffer = new Uint8Array(newestLength)
            // copy current buffer to this.buffer from zero
            // enlarge with more length
            this.buffer.set(buffer, 0)
        }
        return this
    }

    write(buffer: Uint8Array): BufferWriter {
        this.enlarge(buffer.length)
        // copy buffer to this.buffer start in this.index
        this.buffer.set(buffer, this.index)
        this.index += buffer.length
        return this
    }

    writeString(string: string): BufferWriter {
        const buffer = encode(string)
        // buffer.byteLength === buffer.length without offset
        this.enlarge(buffer.length)
        // copy buffer to this.buffer start in this.index
        this.buffer.set(buffer, this.index)
        this.index += buffer.length
        return this
    }

    writeInt8(digit: number): BufferWriter {
        this.enlarge(1)
        this.buffer[this.index++] = (digit >>> 0) & 0xff
        return this
    }

    writeInt16(digit: number): BufferWriter {
        this.enlarge(2)
        this.buffer[this.index++] = (digit >>> 8) & 0xff
        this.buffer[this.index++] = (digit >>> 0) & 0xff
        return this
    }

    writeInt32(digit: number): BufferWriter {
        this.enlarge(4)
        this.buffer[this.index++] = (digit >>> 24) & 0xff
        this.buffer[this.index++] = (digit >>> 16) & 0xff
        this.buffer[this.index++] = (digit >>> 8) & 0xff
        this.buffer[this.index++] = (digit >>> 0) & 0xff
        return this
    }

    writeUint8(digit: number): BufferWriter {
        this.enlarge(1)
        this.buffer[this.index++] = (digit >> 0) & 0xff
        return this
    }

    writeUint16(digit: number): BufferWriter {
        this.enlarge(2)
        this.buffer[this.index++] = (digit >> 0) & 0xff
        this.buffer[this.index++] = (digit >> 8) & 0xff
        return this
    }

    writeUint32(digit: number): BufferWriter {
        this.enlarge(4)
        this.buffer[this.index++] = (digit >> 0) & 0xff
        this.buffer[this.index++] = (digit >> 8) & 0xff
        this.buffer[this.index++] = (digit >> 16) & 0xff
        this.buffer[this.index++] = (digit >> 24) & 0xff
        return this
    }

}