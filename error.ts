



/**
 * error classes
 * https://github.com/psycopg/psycopg2/blob/master/lib/errorcodes.py
 * 
 * in typescript, an enum member cannot have a numeric name.
 * so here, we can only use dict map
 */
export const ERROR_CLASSES_MAP = {
    '00': 'CLASS_SUCCESSFUL_COMPLETION',
    '01': 'CLASS_WARNING',
    '02': 'CLASS_NO_DATA',
    '03': 'CLASS_SQL_STATEMENT_NOT_YET_COMPLETE',
    '08': 'CLASS_CONNECTION_EXCEPTION',
    '09': 'CLASS_TRIGGERED_ACTION_EXCEPTION',
    '0A': 'CLASS_FEATURE_NOT_SUPPORTED',
    '0B': 'CLASS_INVALID_TRANSACTION_INITIATION',
    '0F': 'CLASS_LOCATOR_EXCEPTION',
    '0L': 'CLASS_INVALID_GRANTOR',
    '0P': 'CLASS_INVALID_ROLE_SPECIFICATION',
    '0Z': 'CLASS_DIAGNOSTICS_EXCEPTION',
    '20': 'CLASS_CASE_NOT_FOUND',
    '21': 'CLASS_CARDINALITY_VIOLATION',
    '22': 'CLASS_DATA_EXCEPTION',
    '23': 'CLASS_INTEGRITY_CONSTRAINT_VIOLATION',
    '24': 'CLASS_INVALID_CURSOR_STATE',
    '25': 'CLASS_INVALID_TRANSACTION_STATE',
    '26': 'CLASS_INVALID_SQL_STATEMENT_NAME',
    '27': 'CLASS_TRIGGERED_DATA_CHANGE_VIOLATION',
    '28': 'CLASS_INVALID_AUTHORIZATION_SPECIFICATION',
    '2B': 'CLASS_DEPENDENT_PRIVILEGE_DESCRIPTORS_STILL_EXIST',
    '2D': 'CLASS_INVALID_TRANSACTION_TERMINATION',
    '2F': 'CLASS_SQL_ROUTINE_EXCEPTION',
    '34': 'CLASS_INVALID_CURSOR_NAME',
    '38': 'CLASS_EXTERNAL_ROUTINE_EXCEPTION',
    '39': 'CLASS_EXTERNAL_ROUTINE_INVOCATION_EXCEPTION',
    '3B': 'CLASS_SAVEPOINT_EXCEPTION',
    '3D': 'CLASS_INVALID_CATALOG_NAME',
    '3F': 'CLASS_INVALID_SCHEMA_NAME',
    '40': 'CLASS_TRANSACTION_ROLLBACK',
    '42': 'CLASS_SYNTAX_ERROR_OR_ACCESS_RULE_VIOLATION',
    '44': 'CLASS_WITH_CHECK_OPTION_VIOLATION',
    '53': 'CLASS_INSUFFICIENT_RESOURCES',
    '54': 'CLASS_PROGRAM_LIMIT_EXCEEDED',
    '55': 'CLASS_OBJECT_NOT_IN_PREREQUISITE_STATE',
    '57': 'CLASS_OPERATOR_INTERVENTION',
    '58': 'CLASS_SYSTEM_ERROR',
    '72': 'CLASS_SNAPSHOT_FAILURE',
    'F0': 'CLASS_CONFIGURATION_FILE_ERROR',
    'HV': 'CLASS_FOREIGN_DATA_WRAPPER_ERROR',
    'P0': 'CLASS_PL_PGSQL_ERROR',
    'XX': 'CLASS_INTERNAL_ERROR',
}

/** 
 * error code
 * https://github.com/psycopg/psycopg2/blob/master/psycopg/sqlstate_errors.h
 * 
 * in typescript, an enum member cannot have a numeric name.
 * so here, we can only use dict map
 */
export const ERROR_CODE_MAP = {
    /* Class 02 - No Data (this is also a warning class per the SQL standard) */
    '02000': 'NoData',
    '02001': 'NoAdditionalDynamicResultSetsReturned',

    /* Class 03 - SQL Statement Not Yet Complete */
    '03000': 'SqlStatementNotYetComplete',

    /* Class 08 - Connection Exception */
    '08000': 'ConnectionException',
    '08001': 'SqlclientUnableToEstablishSqlconnection',
    '08003': 'ConnectionDoesNotExist',
    '08004': 'SqlserverRejectedEstablishmentOfSqlconnection',
    '08006': 'ConnectionFailure',
    '08007': 'TransactionResolutionUnknown',
    '08P01': 'ProtocolViolation',

    /* Class 09 - Triggered Action Exception */
    '09000': 'TriggeredActionException',

    /* Class 0A - Feature Not Supported */
    '0A000': 'FeatureNotSupported',

    /* Class 0B - Invalid Transaction Initiation */
    '0B000': 'InvalidTransactionInitiation',

    /* Class 0F - Locator Exception */
    '0F000': 'LocatorException',
    '0F001': 'InvalidLocatorSpecification',

    /* Class 0L - Invalid Grantor */
    '0L000': 'InvalidGrantor',
    '0LP01': 'InvalidGrantOperation',

    /* Class 0P - Invalid Role Specification */
    '0P000': 'InvalidRoleSpecification',

    /* Class 0Z - Diagnostics Exception */
    '0Z000': 'DiagnosticsException',
    '0Z002': 'StackedDiagnosticsAccessedWithoutActiveHandler',

    /* Class 20 - Case Not Found */
    '20000': 'CaseNotFound',

    /* Class 21 - Cardinality Violation */
    '21000': 'CardinalityViolation',

    /* Class 22 - Data Exception */
    '22000': 'DataException',
    '22001': 'StringDataRightTruncation',
    '22002': 'NullValueNoIndicatorParameter',
    '22003': 'NumericValueOutOfRange',
    '22004': 'NullValueNotAllowed',
    '22005': 'ErrorInAssignment',
    '22007': 'InvalidDatetimeFormat',
    '22008': 'DatetimeFieldOverflow',
    '22009': 'InvalidTimeZoneDisplacementValue',
    '2200B': 'EscapeCharacterConflict',
    '2200C': 'InvalidUseOfEscapeCharacter',
    '2200D': 'InvalidEscapeOctet',
    '2200F': 'ZeroLengthCharacterString',
    '2200G': 'MostSpecificTypeMismatch',
    '2200H': 'SequenceGeneratorLimitExceeded',
    '2200L': 'NotAnXmlDocument',
    '2200M': 'InvalidXmlDocument',
    '2200N': 'InvalidXmlContent',
    '2200S': 'InvalidXmlComment',
    '2200T': 'InvalidXmlProcessingInstruction',
    '22010': 'InvalidIndicatorParameterValue',
    '22011': 'SubstringError',
    '22012': 'DivisionByZero',
    '22013': 'InvalidPrecedingOrFollowingSize',
    '22014': 'InvalidArgumentForNtileFunction',
    '22015': 'IntervalFieldOverflow',
    '22016': 'InvalidArgumentForNthValueFunction',
    '22018': 'InvalidCharacterValueForCast',
    '22019': 'InvalidEscapeCharacter',
    '2201B': 'InvalidRegularExpression',
    '2201E': 'InvalidArgumentForLogarithm',
    '2201F': 'InvalidArgumentForPowerFunction',
    '2201G': 'InvalidArgumentForWidthBucketFunction',
    '2201W': 'InvalidRowCountInLimitClause',
    '2201X': 'InvalidRowCountInResultOffsetClause',
    '22021': 'CharacterNotInRepertoire',
    '22022': 'IndicatorOverflow',
    '22023': 'InvalidParameterValue',
    '22024': 'UnterminatedCString',
    '22025': 'InvalidEscapeSequence',
    '22026': 'StringDataLengthMismatch',
    '22027': 'TrimError',
    '2202E': 'ArraySubscriptError',
    '2202G': 'InvalidTablesampleRepeat',
    '2202H': 'InvalidTablesampleArgument',
    '22030': 'DuplicateJsonObjectKeyValue',
    '22031': 'InvalidArgumentForSqlJsonDatetimeFunction',
    '22032': 'InvalidJsonText',
    '22033': 'InvalidSqlJsonSubscript',
    '22034': 'MoreThanOneSqlJsonItem',
    '22035': 'NoSqlJsonItem',
    '22036': 'NonNumericSqlJsonItem',
    '22037': 'NonUniqueKeysInAJsonObject',
    '22038': 'SingletonSqlJsonItemRequired',
    '22039': 'SqlJsonArrayNotFound',
    '2203A': 'SqlJsonMemberNotFound',
    '2203B': 'SqlJsonNumberNotFound',
    '2203C': 'SqlJsonObjectNotFound',
    '2203D': 'TooManyJsonArrayElements',
    '2203E': 'TooManyJsonObjectMembers',
    '2203F': 'SqlJsonScalarRequired',
    '22P01': 'FloatingPointException',
    '22P02': 'InvalidTextRepresentation',
    '22P03': 'InvalidBinaryRepresentation',
    '22P04': 'BadCopyFileFormat',
    '22P05': 'UntranslatableCharacter',
    '22P06': 'NonstandardUseOfEscapeCharacter',

    /* Class 23 - Integrity Constraint Violation */
    '23000': 'IntegrityConstraintViolation',
    '23001': 'RestrictViolation',
    '23502': 'NotNullViolation',
    '23503': 'ForeignKeyViolation',
    '23505': 'UniqueViolation',
    '23514': 'CheckViolation',
    '23P01': 'ExclusionViolation',

    /* Class 24 - Invalid Cursor State */
    '24000': 'InvalidCursorState',

    /* Class 25 - Invalid Transaction State */
    '25000': 'InvalidTransactionState',
    '25001': 'ActiveSqlTransaction',
    '25002': 'BranchTransactionAlreadyActive',
    '25003': 'InappropriateAccessModeForBranchTransaction',
    '25004': 'InappropriateIsolationLevelForBranchTransaction',
    '25005': 'NoActiveSqlTransactionForBranchTransaction',
    '25006': 'ReadOnlySqlTransaction',
    '25007': 'SchemaAndDataStatementMixingNotSupported',
    '25008': 'HeldCursorRequiresSameIsolationLevel',
    '25P01': 'NoActiveSqlTransaction',
    '25P02': 'InFailedSqlTransaction',
    '25P03': 'IdleInTransactionSessionTimeout',

    /* Class 26 - Invalid SQL Statement Name */
    '26000': 'InvalidSqlStatementName',

    /* Class 27 - Triggered Data Change Violation */
    '27000': 'TriggeredDataChangeViolation',

    /* Class 28 - Invalid Authorization Specification */
    '28000': 'InvalidAuthorizationSpecification',
    '28P01': 'InvalidPassword',

    /* Class 2B - Dependent Privilege Descriptors Still Exist */
    '2B000': 'DependentPrivilegeDescriptorsStillExist',
    '2BP01': 'DependentObjectsStillExist',

    /* Class 2D - Invalid Transaction Termination */
    '2D000': 'InvalidTransactionTermination',

    /* Class 2F - SQL Routine Exception */
    '2F000': 'SqlRoutineException',
    '2F002': 'ModifyingSqlDataNotPermitted',
    '2F003': 'ProhibitedSqlStatementAttempted',
    '2F004': 'ReadingSqlDataNotPermitted',
    '2F005': 'FunctionExecutedNoReturnStatement',

    /* Class 34 - Invalid Cursor Name */
    '34000': 'InvalidCursorName',

    /* Class 38 - External Routine Exception */
    '38000': 'ExternalRoutineException',
    '38001': 'ContainingSqlNotPermitted',
    '38002': 'ModifyingSqlDataNotPermittedExt',
    '38003': 'ProhibitedSqlStatementAttemptedExt',
    '38004': 'ReadingSqlDataNotPermittedExt',

    /* Class 39 - External Routine Invocation Exception */
    '39000': 'ExternalRoutineInvocationException',
    '39001': 'InvalidSqlstateReturned',
    '39004': 'NullValueNotAllowedExt',
    '39P01': 'TriggerProtocolViolated',
    '39P02': 'SrfProtocolViolated',
    '39P03': 'EventTriggerProtocolViolated',

    /* Class 3B - Savepoint Exception */
    '3B000': 'SavepointException',
    '3B001': 'InvalidSavepointSpecification',

    /* Class 3D - Invalid Catalog Name */
    '3D000': 'InvalidCatalogName',

    /* Class 3F - Invalid Schema Name */
    '3F000': 'InvalidSchemaName',

    /* Class 40 - Transaction Rollback */
    '40000': 'TransactionRollback',
    '40001': 'SerializationFailure',
    '40002': 'TransactionIntegrityConstraintViolation',
    '40003': 'StatementCompletionUnknown',
    '40P01': 'DeadlockDetected',

    /* Class 42 - Syntax Error or Access Rule Violation */
    '42000': 'SyntaxErrorOrAccessRuleViolation',
    '42501': 'InsufficientPrivilege',
    '42601': 'SyntaxError',
    '42602': 'InvalidName',
    '42611': 'InvalidColumnDefinition',
    '42622': 'NameTooLong',
    '42701': 'DuplicateColumn',
    '42702': 'AmbiguousColumn',
    '42703': 'UndefinedColumn',
    '42704': 'UndefinedObject',
    '42710': 'DuplicateObject',
    '42712': 'DuplicateAlias',
    '42723': 'DuplicateFunction',
    '42725': 'AmbiguousFunction',
    '42803': 'GroupingError',
    '42804': 'DatatypeMismatch',
    '42809': 'WrongObjectType',
    '42830': 'InvalidForeignKey',
    '42846': 'CannotCoerce',
    '42883': 'UndefinedFunction',
    '428C9': 'GeneratedAlways',
    '42939': 'ReservedName',
    '42P01': 'UndefinedTable',
    '42P02': 'UndefinedParameter',
    '42P03': 'DuplicateCursor',
    '42P04': 'DuplicateDatabase',
    '42P05': 'DuplicatePreparedStatement',
    '42P06': 'DuplicateSchema',
    '42P07': 'DuplicateTable',
    '42P08': 'AmbiguousParameter',
    '42P09': 'AmbiguousAlias',
    '42P10': 'InvalidColumnReference',
    '42P11': 'InvalidCursorDefinition',
    '42P12': 'InvalidDatabaseDefinition',
    '42P13': 'InvalidFunctionDefinition',
    '42P14': 'InvalidPreparedStatementDefinition',
    '42P15': 'InvalidSchemaDefinition',
    '42P16': 'InvalidTableDefinition',
    '42P17': 'InvalidObjectDefinition',
    '42P18': 'IndeterminateDatatype',
    '42P19': 'InvalidRecursion',
    '42P20': 'WindowingError',
    '42P21': 'CollationMismatch',
    '42P22': 'IndeterminateCollation',

    /* Class 44 - WITH CHECK OPTION Violation */
    '44000': 'WithCheckOptionViolation',

    /* Class 53 - Insufficient Resources */
    '53000': 'InsufficientResources',
    '53100': 'DiskFull',
    '53200': 'OutOfMemory',
    '53300': 'TooManyConnections',
    '53400': 'ConfigurationLimitExceeded',

    /* Class 54 - Program Limit Exceeded */
    '54000': 'ProgramLimitExceeded',
    '54001': 'StatementTooComplex',
    '54011': 'TooManyColumns',
    '54023': 'TooManyArguments',

    /* Class 55 - Object Not In Prerequisite State */
    '55000': 'ObjectNotInPrerequisiteState',
    '55006': 'ObjectInUse',
    '55P02': 'CantChangeRuntimeParam',
    '55P03': 'LockNotAvailable',
    '55P04': 'UnsafeNewEnumValueUsage',

    /* Class 57 - Operator Intervention */
    '57000': 'OperatorIntervention',
    '57014': 'QueryCanceled',
    '57P01': 'AdminShutdown',
    '57P02': 'CrashShutdown',
    '57P03': 'CannotConnectNow',
    '57P04': 'DatabaseDropped',

    /* Class 58 - System Error (errors external to PostgreSQL itself) */
    '58000': 'SystemError',
    '58030': 'IoError',
    '58P01': 'UndefinedFile',
    '58P02': 'DuplicateFile',

    /* Class 72 - Snapshot Failure */
    '72000': 'SnapshotTooOld',

    /* Class F0 - Configuration File Error */
    'F0000': 'ConfigFileError',
    'F0001': 'LockFileExists',

    /* Class HV - Foreign Data Wrapper Error (SQL/MED) */
    'HV000': 'FdwError',
    'HV001': 'FdwOutOfMemory',
    'HV002': 'FdwDynamicParameterValueNeeded',
    'HV004': 'FdwInvalidDataType',
    'HV005': 'FdwColumnNameNotFound',
    'HV006': 'FdwInvalidDataTypeDescriptors',
    'HV007': 'FdwInvalidColumnName',
    'HV008': 'FdwInvalidColumnNumber',
    'HV009': 'FdwInvalidUseOfNullPointer',
    'HV00A': 'FdwInvalidStringFormat',
    'HV00B': 'FdwInvalidHandle',
    'HV00C': 'FdwInvalidOptionIndex',
    'HV00D': 'FdwInvalidOptionName',
    'HV00J': 'FdwOptionNameNotFound',
    'HV00K': 'FdwReplyHandle',
    'HV00L': 'FdwUnableToCreateExecution',
    'HV00M': 'FdwUnableToCreateReply',
    'HV00N': 'FdwUnableToEstablishConnection',
    'HV00P': 'FdwNoSchemas',
    'HV00Q': 'FdwSchemaNotFound',
    'HV00R': 'FdwTableNotFound',
    'HV010': 'FdwFunctionSequenceError',
    'HV014': 'FdwTooManyHandles',
    'HV021': 'FdwInconsistentDescriptorInformation',
    'HV024': 'FdwInvalidAttributeValue',
    'HV090': 'FdwInvalidStringLengthOrBufferLength',
    'HV091': 'FdwInvalidDescriptorFieldIdentifier',

    /* Class P0 - PL/pgSQL Error */
    'P0000': 'PlpgsqlError',
    'P0001': 'RaiseException',
    'P0002': 'NoDataFound',
    'P0003': 'TooManyRows',
    'P0004': 'AssertFailure',

    /* Class XX - Internal Error */
    'XX000': 'InternalError',
    'XX001': 'DataCorrupted',
    'XX002': 'IndexCorrupted',
}



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

