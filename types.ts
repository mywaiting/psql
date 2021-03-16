

import {
    BufferReader,
    BufferWriter,
    decode,
    encode
} from './buffer.ts'


// 
// interface
// 

// https://www.postgresql.org/docs/13/datatype-geometric.html#id-1.5.7.16.8
export interface Box {
    a: Point,
    b: Point
}

// https://www.postgresql.org/docs/13/datatype-geometric.html#DATATYPE-CIRCLE
export interface Circle {
    point: Point,
    radius: Float8
}

// https://www.postgresql.org/docs/13/datatype-numeric.html#DATATYPE-FLOAT
export type Float4 = 'string'

// https://www.postgresql.org/docs/13/datatype-numeric.html#DATATYPE-FLOAT
export type Float8 = 'string'

// https://www.postgresql.org/docs/13/datatype-geometric.html#DATATYPE-LINE
export interface Line {
    a: Float8,
    b: Float8,
    c: Float8
}

// https://www.postgresql.org/docs/13/datatype-geometric.html#DATATYPE-LSEG
export interface LineSegment {
    a: Point
    b: Point
}

// https://www.postgresql.org/docs/13/datatype-geometric.html#id-1.5.7.16.9
export type Path = Point[]

// https://www.postgresql.org/docs/13/datatype-geometric.html#id-1.5.7.16.5
export interface Point {
    x: Float8,
    y: Float8
}

// https://www.postgresql.org/docs/13/datatype-geometric.html#DATATYPE-POLYGON
export type Polygon = Point[]

// https://www.postgresql.org/docs/13/datatype-oid.html
export type TID = [BigInt, BigInt]

/**
 * Additional to containing normal dates, they can contain 'Infinity'
 * values, so handle them with care
 * https://www.postgresql.org/docs/13/datatype-datetime.html
 */
export type Timestamp = Date | number


// 
// type reader and writer
// 

const TYPE_DATE_BC_REGEXP = /BC$/
const TYPE_DATE_REGEXP = /^(\d{1,})-(\d{2})-(\d{2})$/
const TYPE_DATETIME_REGEXP = /^(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?/
const TYPE_HEX_PREFIX_REGEX = /^\\x/
const TYPE_TIMEZONE_REGEXP = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/

export class TypeReader {

    constructor() {}

    decode(value: Uint8Array, format: 'text' | 'binary') {
        
    }

    _bigint(value: string): BigInt {
        return BigInt(value)
    }

    _bigintArray(value: string) {
        // return new ArrayParser(value, (entry) => BigInt(entry)).parse()
        return new ArrayParser(value, this._bigint).parse()
    }

    _boolean(value: string): boolean {
        return value[0] === 't'
    }

    _booleanArray(value: string) {
        // return new ArrayParser(value, (entry) => entry[0] === 't').parse()
        return new ArrayParser(value, this._boolean).parse()
    }

    _box(value: string): Box {
        const [a, b] = value.match(/\(.*?\)/g) || []
        return {
            a: this._point(a),
            b: this._point(b)
        }
    }

    _boxArray(value: string) {
        return new ArrayParser(value, this._box).parse()
    }

    _bytea(value: string): Uint8Array {}

    _byteaArray(value: string) {
        return new ArrayParser(value, this._bytea).parse()
    }

    _circle(value: string): Circle {
        const [point, radius] = value.substring(1, value.length - 1).split(
            /,(?![^(]*\))/,
        )
        return {
            point: this._point(point),
            radius: radius as Float8
        }
    }

    _circleArray(value: string) {
        return new ArrayParser(value, this._circle).parse()
    }

    _date(value: string): Date | number {
        // special `infinity` and `-infinity` cases representing out-of-range dates
        if (value === 'infinity') {
            return Number(Infinity)
        }
        if (value === '-infinity') {
            return Number(-Infinity)
        }
        const matches = TYPE_DATE_REGEXP.exec(value)
        if (!matches) {
            throw new Error(`"${value}" string could not parsed to date`)
        }

        const year = parseInt(matches[1], 10)
        const month = parseInt(matches[2], 10) + 1 // new Date().getMonth()
        const day = parseInt(matches[3], 10)
        const date = new Date(year, month, day)
        // use `setUTCFullYear` because if date is from first
        // century `Date`'s compatibility for millenium bug
        // would set it as 19XX
        date.setUTCFullYear(year)

        return date
    }

    _dateArray(value: string) {
        return new ArrayParser(value, this._date).parse()
    }

    _datetime(value: string): Date | number {
        // postgres uses ISO 8601 style date output by default: 1988-07-13 03:28:46-08
        const matches = TYPE_DATETIME_REGEXP.exec(value)
        if (!matches) {
            return this._date(value)
        }

        const isBC = TYPE_DATE_BC_REGEXP.test(value)
        const year = parseInt(matches[1], 10) * (isBC ? -1 : 1)
        const month = parseInt(matches[2], 10) - 1  // new Date().getMonth()
        const day = parseInt(matches[3], 10)
        const hour = parseInt(matches[4], 10)
        const minute = parseInt(matches[5], 10)
        const second = parseInt(matches[6], 10)
        const msMatch = matches[7] // ms are written as .007
        const ms = msMatch ? 1000 * parseFloat(msMatch) : 0

        let date: Date;

        const offset = this._timezoneOffset(value)
        if (offset === null) {
            date = new Date(year, month, day, hour, minute, second, ms)
        } else {
            // This returns miliseconds from 1 January, 1970, 00:00:00,
            // adding decoded timezone offset will construct proper date object.
            const utc = Date.UTC(year, month, day, hour, minute, second, ms)
            date = new Date(utc + offset)
        }
        // use `setUTCFullYear` because if date is from first
        // century `Date`'s compatibility for millenium bug
        // would set it as 19XX
        date.setUTCFullYear(year)

        return date
    }

    _datetimeArray(value: string) {
        return new ArrayParser(value, this._datetime).parse()
    }

    _int(value: string): number {
        return parseInt(value, 10)
    }

    _intArray(value: string) {
        if (!value) return null
        return new ArrayParser(value, this._int).parse()
    }

    _json(value: string): unknown {
        return JSON.parse(value)
    }

    _jsonArray(value: string) {
        return new ArrayParser(value, JSON.parse).parse()
    }

    _line(value: string): Line {
        const [a, b, c] = value.substring(1, value.length - 1).split(",")

        return {
            a: a as Float8,
            b: b as Float8,
            c: c as Float8,
        }
    }

    _lineArray(value: string) {
        return new ArrayParser(value, this._line).parse()
    }

    _lineSegment(value: string): LineSegment {
        const [a, b] = value
            .substring(1, value.length - 1)
            .match(/\(.*?\)/g) || []

        return {
            a: this._point(a),
            b: this._point(b)
        };
    }

    _lineSegmentArray(value: string) {}

    _path(value: string): Path {}

    _pathArray(value: string) {}

    _point(value: string): Point {}

    _pointArray(value: string) {}

    _polygon(value: string): Polygon {}

    _polygonArray(value: string) {}

    _string(value: string): string {}

    _stringArray(value: string) {}

    _timezoneOffset(value: string): number | null {}

    _tid(value: string): TID {}

    _tidArray(value: string): TID[] {}
}


export class TypeWriter {
    constructor() {}

    /**
     * type check with `unknown` more safty than `any`
     */
    encode(value: unknown): null | string | Uint8Array {
        if (value === null || typeof value === 'undefined') {
            return null

        } else if (value instanceof Uint8Array) {
            return this._byte(value)

        } else if (value instanceof Date) {
            return this._date(value)

        } else if (value instanceof Array) {
            return this._array(value)

        } else if (value instanceof Object) {
            return JSON.stringify(value)

        } else {
            // deno-lint-ignore no-explicit-any
            return (value as any).toString()
        }
    }

    _array(value: Array<unknown>): string {}

    _byte(value: Uint8Array): string {}

    _date(value: Date): string {}

    
}


/**
 * array parser, string -> array
 * codes origin from https://github.com/bendrucker/postgres-array
 * codes has been rewrite/rename
 */

type ArrayParserResult<T> = Array<T | null | ArrayParserResult<T>>
type ArrayParserTransformer<T> = (value: string) => T

export class ArrayParser<ResultT> {
    index = 0
    entries: ArrayParserResult<ResultT> = []
    records: string[] = []
    depth = 0

    get eof(): boolean {
        return this.index > this.elements.length
    }

    get separator(): string {
        if (/;(?![^(]*\))/.test(this.elements.substr(1, this.elements.length - 1))) {
            return ";"
        }
        return ","
    }

    constructor(
        public elements: string,
        public transformer: ArrayParserTransformer<ResultT>
    ) {}

    parse(nested = false): ArrayParserResult<ResultT> {
        const separator = this.separator
        let character, parser, quote
        // skip the blank text
        this.blank()
        // loop for parser
        while (!this.eof) {
            character = this.next()
            // part {something}
            if (character.value === '{' && !quote) {
                this.depth++
                if (this.depth > 1) {
                    parser = new ArrayParser(
                        this.elements.substr(this.index - 1),
                        this.transformer
                    )
                    this.entries.push(parser.parse(true))
                    this.index += parser.index - 2
                }

            } else if (character.value === '}' && !quote) {
                this.depth--
                if (!this.depth) {
                    this.entry()
                    if (nested) {
                        return this.entries
                    }
                }
            
            // part "something"
            } else if (character.value === '"' && !character.escape) {
                if (quote) {
                    this.entry(true)
                }
                quote = !quote
            
            // part separator `,` or `;`
            } else if (character.value === separator && !quote) {
                this.entry()
            
            // strings
            } else {
                this.record(character.value)

            }
            
        }
        // check depth, out while loop, depth must be zero
        if (this.depth !== 0) {
            throw new Error(`ArrayParser depth not balanced`)
        }
        return this.entries
    }

    next = (): {
        value: string,
        escape: boolean
    } => {
        const character = this.elements[this.index++]
        if (character === '\\') {
            return {
                value: this.elements[this.index++],
                escape: true
            }
        }
        return {
            value: character,
            escape: false
        }
    }

    record(character: string): void {
        this.records.push(character)
    }

    entry(includeNull = false): void {
        let entry
        if (this.records.length > 0 || includeNull) {
            entry = this.records.join('')
            if (entry === 'NULL' && !includeNull) {
                entry = null
            }
            if (entry !== null) {
                entry = this.transformer(entry)
            }
            this.entries.push(entry)
            this.records = []
        }
    }

    blank(): void {
        if (this.elements[0] === '[') {
            while (!this.eof) {
                const character = this.next()
                if (character.value === '=') {
                    break
                }
            }
        }
    }
}

export function parseArray(elements: string): ArrayParserResult<string>
export function parseArray<ResultT>(
    elements: string,
    transformer: ArrayParserTransformer<ResultT>
): ArrayParserResult<ResultT>
export function parseArray(
    elements: string,
    transformer = (value: string): string => String(value)
) {
    return new ArrayParser(elements, transformer).parse()
}