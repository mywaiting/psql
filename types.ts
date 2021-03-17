
import {
    OID_TYPE_CODE,
    OID_TYPE_NAME
} from './const.ts'
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


/**
 * type reader and writer
 * codes origin from https://github.com/denodrivers/postgres
 * codes has been rewrite/rename
 */

const TYPE_DATE_BC_REGEXP = /BC$/
const TYPE_DATE_REGEXP = /^(\d{1,})-(\d{2})-(\d{2})$/
const TYPE_DATETIME_REGEXP = /^(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?/
const TYPE_HEX_PREFIX_REGEX = /^\\x/
const TYPE_TIMEZONE_REGEXP = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/

export class TypeReader {

    constructor() {}

    decode(value: Uint8Array, oid: OID_TYPE_CODE, format: 'text' | 'binary' = 'text') {
        if (format === 'binary') {
            throw new Error(`not support binary type decode now`)
        } else if (format === 'text') {
            const strValue = decode(value)
            switch (oid) {
                case OID_TYPE_CODE.bpchar:
                case OID_TYPE_CODE.char:
                case OID_TYPE_CODE.cidr:
                case OID_TYPE_CODE.float4:
                case OID_TYPE_CODE.float8:
                case OID_TYPE_CODE.inet:
                case OID_TYPE_CODE.macaddr:
                case OID_TYPE_CODE.name:
                case OID_TYPE_CODE.numeric:
                case OID_TYPE_CODE.oid:
                case OID_TYPE_CODE.regclass:
                case OID_TYPE_CODE.regconfig:
                case OID_TYPE_CODE.regdictionary:
                case OID_TYPE_CODE.regnamespace:
                case OID_TYPE_CODE.regoper:
                case OID_TYPE_CODE.regoperator:
                case OID_TYPE_CODE.regproc:
                case OID_TYPE_CODE.regprocedure:
                case OID_TYPE_CODE.regrole:
                case OID_TYPE_CODE.regtype:
                case OID_TYPE_CODE.text:
                case OID_TYPE_CODE.time:
                case OID_TYPE_CODE.timetz:
                case OID_TYPE_CODE.uuid:
                case OID_TYPE_CODE.varchar:
                case OID_TYPE_CODE.void:
                    return strValue
                case OID_TYPE_CODE._bpchar:
                case OID_TYPE_CODE._char:
                case OID_TYPE_CODE._cidr:
                case OID_TYPE_CODE._float4:
                case OID_TYPE_CODE._float8:
                case OID_TYPE_CODE._inet:
                case OID_TYPE_CODE._macaddr:
                case OID_TYPE_CODE._name:
                case OID_TYPE_CODE._numeric:
                case OID_TYPE_CODE._oid:
                case OID_TYPE_CODE._regclass:
                case OID_TYPE_CODE._regconfig:
                case OID_TYPE_CODE._regdictionary:
                case OID_TYPE_CODE._regnamespace:
                case OID_TYPE_CODE._regoper:
                case OID_TYPE_CODE._regoperator:
                case OID_TYPE_CODE._regproc:
                case OID_TYPE_CODE._regprocedure:
                case OID_TYPE_CODE._regrole:
                case OID_TYPE_CODE._regtype:
                case OID_TYPE_CODE._text:
                case OID_TYPE_CODE._time:
                case OID_TYPE_CODE._timetz:
                case OID_TYPE_CODE._uuid:
                case OID_TYPE_CODE._varchar:
                    return this._stringArray(strValue)

                case OID_TYPE_CODE.int2:
                case OID_TYPE_CODE.int4:
                case OID_TYPE_CODE.xid:
                    return this._int(strValue)
                case OID_TYPE_CODE._int2:
                case OID_TYPE_CODE._int4:
                case OID_TYPE_CODE._xid:
                    return this._intArray(strValue)
                
                case OID_TYPE_CODE.bool:
                    return this._boolean(strValue)
                case OID_TYPE_CODE._bool:
                    return this._booleanArray(strValue)
                
                case OID_TYPE_CODE.box:
                    return this._box(strValue)
                case OID_TYPE_CODE._box:
                    return this._boxArray(strValue)

                case OID_TYPE_CODE.bytea:
                    return this._bytea(strValue)
                case OID_TYPE_CODE._bytea:
                    return this._byteaArray(strValue)
                
                case OID_TYPE_CODE.circle:
                    return this._circle(strValue)
                case OID_TYPE_CODE._circle:
                    return this._circleArray(strValue)

                case OID_TYPE_CODE.date:
                    return this._date(strValue)
                case OID_TYPE_CODE._date:
                    return this._dateArray(strValue)

                case OID_TYPE_CODE.int8:
                    return this._bigint(strValue)
                case OID_TYPE_CODE._int8:
                    return this._bigintArray(strValue)
                
                case OID_TYPE_CODE.json:
                case OID_TYPE_CODE.jsonb:
                    return this._json(strValue)
                case OID_TYPE_CODE._json:
                case OID_TYPE_CODE._jsonb:
                    return this._jsonArray(strValue)

                case OID_TYPE_CODE.line:
                    return this._line(strValue)
                case OID_TYPE_CODE._line:
                    return this._lineArray(strValue)

                case OID_TYPE_CODE.lseg:
                    return this._lineSegment(strValue)
                case OID_TYPE_CODE._lseg:
                    return this._lineSegmentArray(strValue)
                
                case OID_TYPE_CODE.path:
                    return this._path(strValue)
                case OID_TYPE_CODE._path:
                    return this._pathArray(strValue)
                
                case OID_TYPE_CODE.point:
                    return this._point(strValue)
                case OID_TYPE_CODE._point:
                    return this._pointArray(strValue)
                
                case OID_TYPE_CODE.polygon:
                    return this._polygon(strValue)
                case OID_TYPE_CODE._polygon:
                    return this._polygonArray(strValue)
                
                case OID_TYPE_CODE.tid:
                    return this._tid(strValue)
                case OID_TYPE_CODE._tid:
                    return this._tidArray(strValue)
                
                case OID_TYPE_CODE.timestamp:
                case OID_TYPE_CODE.timestamptz:
                    return this._datetime(strValue)
                case OID_TYPE_CODE._timestamp:
                case OID_TYPE_CODE._timestamptz:
                    return this._datetimeArray(strValue)
                
                default:
                    // A separate category for not handled values
                    // They might or might not be represented correctly as strings,
                    // returning them to the user as raw strings allows them to parse
                    // them as they see fit
                    return strValue

            }
        } else {
            throw new Error(`unknown format type decode: ${format}`)
        }
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

    _bytea(value: string): Uint8Array {
        // byta Escape
        if (TYPE_HEX_PREFIX_REGEX.test(value)) {
            const bytes = []
            let i = 0, k = 0
            // loop 
            while (i < value.length) {
                if (value[i] !== "\\") {
                    bytes.push(value.charCodeAt(i))
                    ++i
                } else {
                    if (/[0-7]{3}/.test(value.substr(i + 1, 3))) {
                        bytes.push(parseInt(value.substr(i + 1, 3), 8))
                        i += 4
                    } else {
                        let backslashes = 1
                        while (i + backslashes < value.length && value[i + backslashes] === "\\") {
                            backslashes++
                        }
                        for (k = 0; k < Math.floor(backslashes / 2); ++k) {
                            bytes.push(0x5c) // 92 === 0x5c === '\\'.charCodeAt(0), backslash
                        }
                        i += Math.floor(backslashes / 2) * 2
                    }
                }
            }
            return new Uint8Array(bytes)
        // bytea HEX
        } else {
            value = value.slice(2)
            const bytes = new Uint8Array(value.length / 2)
            for (let i = 0, j = 0; i < value.length; i += 2, j++) {
                // parseInt(xxx, 16) means 16 radix, return like 0x13
                bytes[j] = parseInt(value[i] + value[i + 1], 16)
            }
            return bytes
        }
    }

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

    _lineSegmentArray(value: string) {
        return new ArrayParser(value, this._lineSegment).parse()
    }

    _path(value: string): Path {
        // Split on commas that are not inside parantheses
        // since encapsulated commas are separators for the point coordinates
        const points = value.substring(1, value.length - 1).split(/,(?![^(]*\))/)
        return points.map(this._point)
    }

    _pathArray(value: string) {
        return new ArrayParser(value, this._path).parse()
    }

    _point(value: string): Point {
        const [x, y] = value.substring(1, value.length - 1).split(",")

        if (Number.isNaN(parseFloat(x)) || Number.isNaN(parseFloat(y))) {
            throw new Error(
                `Invalid point value: "${Number.isNaN(parseFloat(x)) ? x : y}"`
            );
        }

        return {
            x: x as Float8,
            y: y as Float8
        }
    }

    _pointArray(value: string) {
        return new ArrayParser(value, this._point).parse()
    }

    _polygon(value: string): Polygon {
        return this._path(value)
    }

    _polygonArray(value: string) {
        return new ArrayParser(value, this._polygon).parse()
    }

    _string(value: string): string {
        return String(value)
    }

    _stringArray(value: string) {
        if (!value) return null
        return new ArrayParser(value, this._string).parse()
    }

    _timezoneOffset(value: string): number | null {
        // get rid of date part as TIMEZONE_RE would match '-MM` part
        value = value.split(' ')[1]
        const matches = TYPE_TIMEZONE_REGEXP.exec(value)
        if (!matches) {
            return null
        }

        const prefix = matches[1]
        // special, zulu timezone is zero, UTC === 0
        if (prefix === 'Z') {
            return 0
        }

        // in JS timezone offsets are reversed, ie. timezones
        // that are "positive" (+01:00) are represented as negative
        // offsets and vice-versa
        const sign = prefix === '-' ? 1 : -1

        const hours = parseInt(matches[2], 10)
        const minutes = parseInt(matches[3] || "0", 10)
        const seconds = parseInt(matches[4] || "0", 10)

        const offset = hours * 3600 + minutes * 60 + seconds

        return sign * offset * 1000
    }

    _tid(value: string): TID {
        const [x, y] = value.substring(1, value.length - 1).split(",")
        return [BigInt(x), BigInt(y)]
    }

    _tidArray(value: string) {
        return new ArrayParser(value, this._tid).parse()
    }
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

    _array(value: Array<unknown>): string {
        const encodedArray = ['{']
        value.forEach((element, index) => {
            if (index > 0) {
                encodedArray.push(',')
            }
            if (element === null || typeof element === 'undefined') {
                encodedArray.push('NULL')

            } else if (Array.isArray(element)) {
                encodedArray.concat(this._array(element))

            } else if (element instanceof Uint8Array) {
                throw new Error(`buffer could encoded now`)

            } else {
                const encodedElement = this.encode(element)
                // deno-lint-ignore no-explicit-any
                const strValue = (encodedElement as any).toString()
                const escapedValue = strValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
                encodedArray.push(`"${escapedValue}"`)
            }
        })
        encodedArray.push('}')
        return encodedArray.join('')
    }

    _byte(value: Uint8Array): string {
        const strValue = Array.from(value).map((val) => {
            // number.toString(16), means hexadecimal string output
            // number.toString(radix)
            return val < 10 ? `0${val.toString(16)}` : val.toString(16)

        }).join("")

        return `\\x${strValue}`
    }

    _date(value: Date): string {
        // construct iso datetime string
        const year  = this.padding(value.getFullYear(), 4)
        const month = this.padding(value.getMonth() + 1, 2) // new Date().getMonth()
        const day   = this.padding(value.getDate(), 2)
        const hour  = this.padding(value.getHours(), 2)
        const min   = this.padding(value.getMinutes(), 2)
        const sec   = this.padding(value.getSeconds(), 2)
        const ms    = this.padding(value.getMilliseconds(), 3)

        const encodedDate = `${year}-${month}-${day}T${hour}:${min}:${sec}.${ms}`

        // construct iso timezone string
        const offset    = value.getTimezoneOffset()
        const sign      = offset > 0 ? "-" : "+"
        const absOffset = Math.abs(offset)
        const tzHours   = this.padding(Math.floor(absOffset / 60), 2)
        const tzMinutes = this.padding(Math.floor(absOffset % 60), 2)

        const encodedTz = `${sign}${tzHours}:${tzMinutes}`

        return encodedDate + encodedTz;
    }

    /**
     * padding a number with capacity(how much) zero into value
     * for example, padding(123, 6) === '000123'
     */
    padding(value: number, capacity: number): string {
        let strValue = String(value)
        while (strValue.length < capacity) {
            strValue = '0' + strValue
        }
        return strValue
    }

    
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