



/**
 * global error object for postgres
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 */
class DatabaseError extends Error {
    constructor(
        public name: string = 'DatabaseError',
        public code?: string,
        public message: string = ''
    ) {
        super(`${name}: ${message}`)
    }
}

/**
 * postgres errors class
 * https://github.com/psycopg/psycopg2/blob/master/psycopg/error_type.c
 */
export class OperationalError extends DatabaseError {
    constructor(message: string) {
        super('OperationalError', undefined, message)
    }
}

export class NotSupportedError extends DatabaseError {
    constructor(message: string) {
        super('NotSupportedError', undefined, message)
    }
}

export class ProgrammingError extends DatabaseError {
    constructor(message: string) {
        super('ProgrammingError', undefined, message)
    }
}

export class DataError extends DatabaseError {
    constructor(message: string) {
        super('DataError', undefined, message)
    }
}

export class IntegrityError extends DatabaseError {
    constructor(message: string) {
        super('IntegrityError', undefined, message)
    }
}

export class TransactionRollbackError extends DatabaseError {
    constructor(message: string) {
        super('TransactionRollbackError', undefined, message)
    }
}

export class QueryCanceledError extends DatabaseError {
    constructor(message: string) {
        super('QueryCanceledError', undefined, message)
    }
}

export class InternalError extends DatabaseError {
    constructor(message: string) {
        super('InternalError', undefined, message)
    }
}

/**
 * parse error code and raise an error from postgres error code
 */
export function postgresErrorCode(
    message: string
) {
    
}

export function postgresRaiseError(
    code: string
) {
    switch(code[0]) {

        case '0':
            switch (code[1]) {
                case '8': /* Class 08 - Connection Exception */
                    return OperationalError
                case 'A': /* Class 0A - Feature Not Supported */
                    return NotSupportedError
            }
            break

        case '2':
            switch (code[1]) {
                case '0': /* Class 20 - Case Not Found */
                case '1': /* Class 21 - Cardinality Violation */
                    return ProgrammingError
                case '2': /* Class 22 - Data Exception */
                    return DataError
                case '3': /* Class 23 - Integrity Constraint Violation */
                    return IntegrityError
                case '4': /* Class 24 - Invalid Cursor State */
                case '5': /* Class 25 - Invalid Transaction State */
                    return InternalError
                case '6': /* Class 26 - Invalid SQL Statement Name */
                case '7': /* Class 27 - Triggered Data Change Violation */
                case '8': /* Class 28 - Invalid Authorization Specification */
                    return OperationalError
                case 'B': /* Class 2B - Dependent Privilege Descriptors Still Exist */
                case 'D': /* Class 2D - Invalid Transaction Termination */
                case 'F': /* Class 2F - SQL Routine Exception */
                    return InternalError
            }
            break

        case '3':
            switch (code[1]) {
                case '4': /* Class 34 - Invalid Cursor Name */
                    return OperationalError
                case '8': /* Class 38 - External Routine Exception */
                case '9': /* Class 39 - External Routine Invocation Exception */
                case 'B': /* Class 3B - Savepoint Exception */
                    return InternalError
                case 'D': /* Class 3D - Invalid Catalog Name */
                case 'F': /* Class 3F - Invalid Schema Name */
                    return ProgrammingError
            }
            break

        case '4':
            switch (code[1]) {
                case '0': /* Class 40 - Transaction Rollback */
                    return TransactionRollbackError
                case '2': /* Class 42 - Syntax Error or Access Rule Violation */
                case '4': /* Class 44 - WITH CHECK OPTION Violation */
                    return ProgrammingError
            }
            break

        case '5':
            /* Class 53 - Insufficient Resources
            Class 54 - Program Limit Exceeded
            Class 55 - Object Not In Prerequisite State
            Class 57 - Operator Intervention
            Class 58 - System Error (errors external to PostgreSQL itself) */
            if ( code === "57014") {
                return QueryCanceledError
            } else {
                return OperationalError
            }

        case 'F': /* Class F0 - Configuration File Error */
            return InternalError

        case 'H': /* Class HV - Foreign Data Wrapper Error (SQL/MED) */
            return OperationalError

        case 'P': /* Class P0 - PL/pgSQL Error */
            return InternalError

        case 'X': /* Class XX - Internal Error */
            return InternalError
        
        default:
            /* return DatabaseError as a fallback */
            return DatabaseError
    }
}




/**
 * error for pq infrastructure
 */
export class AuthenticationError extends DatabaseError {
    constructor(message: string) {
        super('AuthenticationError', undefined, message)
    }
}

export class ConnectionError extends DatabaseError {
    constructor(message: string) {
        super('ConnectionError', undefined, message)
    }
}

export class PacketError extends DatabaseError {
    constructor(message: string) {
        super('PacketError', undefined, message)
    }
}

export class QueryError extends DatabaseError {
    constructor(message: string) {
        super('QueryError', undefined, message)
    }
}