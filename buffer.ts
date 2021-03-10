/**
 * buffer reader/writer for postgresql buffer/data-types
 * https://www.postgresql.org/docs/13/protocol-message-types.html
 */



// ported from deno/std/encoding/utf8.ts
const encoder = new TextEncoder()
export function encode(input?: string): Uint8Array {
    return encoder.encode(input)
}

const decoder = new TextDecoder()
export function decode(input?: Uint8Array): string {
    return decoder.decode(input)
}



export class BufferReader {

    index = 0

    constructor(readonly buffer: Uint8Array) {}

    read(length: number): Uint8Array {
        const buffer = this.buffer.slice(this.index, this.index + length)
        this.index += length
        return buffer
    }

}


export class BufferWriter {

    index = 0

    constructor(readonly buffer: Uint8Array) {}

}