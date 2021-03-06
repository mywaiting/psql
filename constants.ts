/**
 * identifies the message with the first byte
 * https://www.postgresql.org/docs/13/protocol-message-formats.html
 */
export const enum MESSAGE_CODE {
    AuthenticationOk                = 0x52, // 'R'
    AuthenticationKerberosV5        = 0x52,
    AuthenticationCleartextPassword = 0x52,
    AuthenticationMD5Password       = 0x52,
    AuthenticationSCMCredential     = 0x52,
    AuthenticationGSS               = 0x52,
    AuthenticationSSPI              = 0x52,
    AuthenticationGSSContinue       = 0x52,
    AuthenticationSASL              = 0x52,
    AuthenticationSASLContinue      = 0x52,
    AuthenticationSASLFinal         = 0x52,
    BackendKeyData                  = 0x4b, // 'K'
    Bind                            = 0x42, // 'B'
    BindComplete                    = 0x32, // '2'
    // CancelRequest = 'CancelRequest',
    Close                    = 0x43, // 'C'
    CloseComplete            = 0x33, // '3'
    CommandComplete          = 0x43, // 'C'
    CopyData                 = 0x64, // 'd'
    CopyDone                 = 0x63, // 'c'
    CopyFail                 = 0x66, // 'f'
    CopyInResponse           = 0x47, // 'G'
    CopyOutResponse          = 0x48, // 'H'
    CopyBothResponse         = 0x57, // 'W'
    DataRow                  = 0x44, // 'D'
    Describe                 = 0x44,
    EmptyQueryResponse       = 0x49, // 'I'
    ErrorResponse            = 0x45, // 'E'
    Execute                  = 0x45,
    Flush                    = 0x48, // 'H'
    FunctionCall             = 0x46, // 'F'
    FunctionCallResponse     = 0x56, // 'V'
    GSSResponse              = 0x70, // 'p'
    NegotiateProtocolVersion = 0x76, // 'v'
    NoData                   = 0x6e, // 'n'
    NoticeResponse           = 0x4e, // 'N'
    NotificationResponse     = 0x41, // 'A'
    ParameterDescription     = 0x74, // 't'
    ParameterStatus          = 0x53, // 'S'
    Parse                    = 0x50, // 'P'
    ParseComplete            = 0x31, // '1'
    PasswordMessage          = 0x70, // 'p'
    PortalSuspended          = 0x73, // 's'
    Query                    = 0x51, // 'Q'
    ReadyForQuery            = 0x5a, // 'Z'
    RowDescription           = 0x54, // 'T'
    SASLInitialResponse      = 0x50, // 'P'
    SASLResponse             = 0x50,
    // SSLRequest = 'SSLRequest',
    // GSSENCRequest = 'GSSENCRequest',
    // StartupMessage = 'StartupMessage',
    Sync      = 0x53,   // 'S'
    Terminate = 0x58,   // 'X'
}


/**
 * identifies the message with its clear name
 * https://www.postgresql.org/docs/13/protocol-message-formats.html
 */
export const enum MESSAGE_NAME {
    /*B*/AuthenticationOk = 'AuthenticationOk',
    /*B*/AuthenticationKerberosV5 = 'AuthenticationKerberosV5',
    /*B*/AuthenticationCleartextPassword = 'AuthenticationCleartextPassword',
    /*B*/AuthenticationMD5Password = 'AuthenticationMD5Password',
    /*B*/AuthenticationSCMCredential = 'AuthenticationSCMCredential',
    /*B*/AuthenticationGSS = 'AuthenticationGSS',
    /*B*/AuthenticationSSPI = 'AuthenticationSSPI',
    /*B*/AuthenticationGSSContinue = 'AuthenticationGSSContinue',
    /*B*/AuthenticationSASL = 'AuthenticationSASL',
    /*B*/AuthenticationSASLContinue = 'AuthenticationSASLContinue',
    /*B*/AuthenticationSASLFinal = 'AuthenticationSASLFinal',
    /*B*/BackendKeyData = 'BackendKeyData',
    Bind = 'Bind',
    /*B*/BindComplete = 'BindComplete',
    CancelRequest = 'CancelRequest',
    Close = 'Close',
    /*B*/CloseComplete = 'CloseComplete',
    /*B*/CommandComplete = 'CommandComplete',
    /*BF*/CopyData = 'CopyData',
    /*BF*/CopyDone = 'CopyDone',
    CopyFail = 'CopyFail',
    /*B*/CopyInResponse = 'CopyInResponse',
    /*B*/CopyOutResponse = 'CopyOutResponse',
    /*B*/CopyBothResponse = 'CopyBothResponse',
    /*B*/DataRow = 'DataRow',
    Describe = 'Describe',
    /*B*/EmptyQueryResponse = 'EmptyQueryResponse',
    /*B*/ErrorResponse = 'ErrorResponse',
    Execute = 'Execute',
    Flush = 'Flush',
    FunctionCall = 'FunctionCall',
    /*B*/FunctionCallResponse = 'FunctionCallResponse',
    GSSResponse = 'GSSResponse',
    /*B*/NegotiateProtocolVersion = 'NegotiateProtocolVersion',
    /*B*/NoData = 'NoData',
    /*B*/NoticeResponse = 'NoticeResponse',
    /*B*/NotificationResponse = 'NotificationResponse',
    /*B*/ParameterDescription = 'ParameterDescription',
    /*B*/ParameterStatus = 'ParameterStatus',
    Parse = 'Parse',
    /*B*/ParseComplete = 'ParseComplete',
    PasswordMessage = 'PasswordMessage',
    /*B*/PortalSuspended = 'PortalSuspended',
    Query = 'Query',
    /*B*/ReadyForQuery = 'ReadyForQuery',
    /*B*/RowDescription = 'RowDescription',
    SASLInitialResponse = 'SASLInitialResponse',
    SASLResponse = 'SASLResponse',
    SSLRequest = 'SSLRequest',
    GSSENCRequest = 'GSSENCRequest',
    StartupMessage = 'StartupMessage',
    Sync = 'Sync',
    Terminate = 'Terminate',
}


/**
 * specifies that authentication message with int32
 */
export const enum AUTHENTICATION_CODE {
    Ok                = 0x00,
    KerberosV5        = 0x02,
    CleartextPassword = 0x03,
    MD5Password       = 0x05,
    SCMCredential     = 0x06,
    GSS               = 0x07,
    GSSContinue       = 0x08,
    SSPI              = 0x09,
    SASL              = 0x0a, // 10
    SASLContinue      = 0x0b, // 11
    SASLFinal         = 0x0c, // 12
}


/**
 * error and notice message fields, same as them
 * https://www.postgresql.org/docs/13/protocol-error-fields.html
 */
export const enum ERROR_MESSAGE {
    SEVERITY          = 'S', // always present.
    // SEVERITY          = 'V', // present only by PostgreSQL versions 9.6 and later
    CODE              = 'C',
    MESSAGE           = 'M',
    DETAIL            = 'D',
    HINT              = 'H',
    POSITION          = 'P',
    INTERNAL_POSITION = 'p',
    INTERNAL_QUERY    = 'q',
    WHERE             = 'W',
    SCHEMA            = 's',
    TABLE             = 't',
    COLUMN            = 'c',
    DATA_TYPE         = 'd',
    CONSTRAINT        = 'n',
    FILE              = 'F',
    LINE              = 'L',
    ROUTINE           = 'R',
}

export const enum NOTICE_MESSAGE {
    SEVERITY          = 'S', // always present.
    // SEVERITY          = 'V', // present only by PostgreSQL versions 9.6 and later
    CODE              = 'C',
    MESSAGE           = 'M',
    DETAIL            = 'D',
    HINT              = 'H',
    POSITION          = 'P',
    INTERNAL_POSITION = 'p',
    INTERNAL_QUERY    = 'q',
    WHERE             = 'W',
    SCHEMA            = 's',
    TABLE             = 't',
    COLUMN            = 'c',
    DATA_TYPE         = 'd',
    CONSTRAINT        = 'n',
    FILE              = 'F',
    LINE              = 'L',
    ROUTINE           = 'R',
}


/**
 * Object Identifier
 * https://www.postgresql.org/docs/13/datatype-oid.html
 * extract all types by:
 * > SELECT typname, oid FROM pg_type WHERE oid < 10000 ORDER BY oid;
 */
export const enum OID_TYPE_CODE {
    'bool'             = 16,
    'bytea'            = 17,
    'char'             = 18,
    'name'             = 19,
    'int8'             = 20,
    'int2'             = 21,
    'int2vector'       = 22,
    'int4'             = 23,
    'regproc'          = 24,
    'text'             = 25,
    'oid'              = 26,
    'tid'              = 27,
    'xid'              = 28,
    'cid'              = 29,
    'oidvector'        = 30,
    'pg_ddl_command'   = 32,
    'pg_type'          = 71,
    'pg_attribute'     = 75,
    'pg_proc'          = 81,
    'pg_class'         = 83,
    'json'             = 114,
    'xml'              = 142,
    '_xml'             = 143,
    'pg_node_tree'     = 194,
    '_json'            = 199,
    'smgr'             = 210,
    'index_am_handler' = 325,
    'point'            = 600,
    'lseg'             = 601,
    'path'             = 602,
    'box'              = 603,
    'polygon'          = 604,
    'line'             = 628,
    '_line'            = 629,
    'cidr'             = 650,
    '_cidr'            = 651,
    'float4'           = 700,
    'float8'           = 701,
    'abstime'          = 702,
    'reltime'          = 703,
    'tinterval'        = 704,
    'unknown'          = 705,
    'circle'           = 718,
    '_circle'          = 719,
    'money'            = 790,
    '_money'           = 791,
    'macaddr'          = 829,
    'inet'             = 869,
    '_bool'            = 1000,
    '_bytea'           = 1001,
    '_char'            = 1002,
    '_name'            = 1003,
    '_int2'            = 1005,
    '_int2vector'      = 1006,
    '_int4'            = 1007,
    '_regproc'         = 1008,
    '_text'            = 1009,
    '_tid'             = 1010,
    '_xid'             = 1011,
    '_cid'             = 1012,
    '_oidvector'       = 1013,
    '_bpchar'          = 1014,
    '_varchar'         = 1015,
    '_int8'            = 1016,
    '_point'           = 1017,
    '_lseg'            = 1018,
    '_path'            = 1019,
    '_box'             = 1020,
    '_float4'          = 1021,
    '_float8'          = 1022,
    '_abstime'         = 1023,
    '_reltime'         = 1024,
    '_tinterval'       = 1025,
    '_polygon'         = 1027,
    '_oid'             = 1028,
    'aclitem'          = 1033,
    '_aclitem'         = 1034,
    '_macaddr'         = 1040,
    '_inet'            = 1041,
    'bpchar'           = 1042,
    'varchar'          = 1043,
    'date'             = 1082,
    'time'             = 1083,
    'timestamp'        = 1114,
    '_timestamp'       = 1115,
    '_date'            = 1182,
    '_time'            = 1183,
    'timestamptz'      = 1184,
    '_timestamptz'     = 1185,
    'interval'         = 1186,
    '_interval'        = 1187,
    '_numeric'         = 1231,
    'pg_database'      = 1248,
    '_cstring'         = 1263,
    'timetz'           = 1266,
    '_timetz'          = 1270,
    'bit'              = 1560,
    '_bit'             = 1561,
    'varbit'           = 1562,
    '_varbit'          = 1563,
    'numeric'          = 1700,
    'refcursor'        = 1790,
    '_refcursor'       = 2201,
    'regprocedure'     = 2202,
    'regoper'          = 2203,
    'regoperator'      = 2204,
    'regclass'         = 2205,
    'regtype'          = 2206,
    '_regprocedure'    = 2207,
    '_regoper'         = 2208,
    '_regoperator'     = 2209,
    '_regclass'        = 2210,
    '_regtype'         = 2211,
    'record'           = 2249,
    'cstring'          = 2275,
    'any'              = 2276,
    'anyarray'         = 2277,
    'void'             = 2278,
    'trigger'          = 2279,
    'language_handler' = 2280,
    'internal'         = 2281,
    'opaque'           = 2282,
    'anyelement'       = 2283,
    '_record'          = 2287,
    'anynonarray'      = 2776,
    'pg_authid'        = 2842,
    'pg_auth_members'  = 2843,
    '_txid_snapshot'   = 2949,
    'uuid'             = 2950,
    '_uuid'            = 2951,
    'txid_snapshot'    = 2970,
    'fdw_handler'      = 3115,
    'pg_lsn'           = 3220,
    '_pg_lsn'          = 3221,
    'tsm_handler'      = 3310,
    'anyenum'          = 3500,
    'tsvector'         = 3614,
    'tsquery'          = 3615,
    'gtsvector'        = 3642,
    '_tsvector'        = 3643,
    '_gtsvector'       = 3644,
    '_tsquery'         = 3645,
    'regconfig'        = 3734,
    '_regconfig'       = 3735,
    'regdictionary'    = 3769,
    '_regdictionary'   = 3770,
    'jsonb'            = 3802,
    '_jsonb'           = 3807,
    'anyrange'         = 3831,
    'event_trigger'    = 3838,
    'int4range'        = 3904,
    '_int4range'       = 3905,
    'numrange'         = 3906,
    '_numrange'        = 3907,
    'tsrange'          = 3908,
    '_tsrange'         = 3909,
    'tstzrange'        = 3910,
    '_tstzrange'       = 3911,
    'daterange'        = 3912,
    '_daterange'       = 3913,
    'int8range'        = 3926,
    '_int8range'       = 3927,
    'pg_shseclabel'    = 4066,
    'regnamespace'     = 4089,
    '_regnamespace'    = 4090,
    'regrole'          = 4096,
    '_regrole'         = 4097,
}

export const enum OID_TYPE_NAME {
	'BOOL'             = 'bool',
	'BYTEA'            = 'bytea',
	'CHAR'             = 'char',
	'NAME'             = 'name',
	'INT8'             = 'int8',
	'INT2'             = 'int2',
	'INT2VECTOR'       = 'int2vector',
	'INT4'             = 'int4',
	'REGPROC'          = 'regproc',
	'TEXT'             = 'text',
	'OID'              = 'oid',
	'TID'              = 'tid',
	'XID'              = 'xid',
	'CID'              = 'cid',
	'OIDVECTOR'        = 'oidvector',
	'PG_DDL_COMMAND'   = 'pg_ddl_command',
	'PG_TYPE'          = 'pg_type',
	'PG_ATTRIBUTE'     = 'pg_attribute',
	'PG_PROC'          = 'pg_proc',
	'PG_CLASS'         = 'pg_class',
	'JSON'             = 'json',
	'XML'              = 'xml',
	'_XML'             = '_xml',
	'PG_NODE_TREE'     = 'pg_node_tree',
	'_JSON'            = '_json',
	'SMGR'             = 'smgr',
	'INDEX_AM_HANDLER' = 'index_am_handler',
	'POINT'            = 'point',
	'LSEG'             = 'lseg',
	'PATH'             = 'path',
	'BOX'              = 'box',
	'POLYGON'          = 'polygon',
	'LINE'             = 'line',
	'_LINE'            = '_line',
	'CIDR'             = 'cidr',
	'_CIDR'            = '_cidr',
	'FLOAT4'           = 'float4',
	'FLOAT8'           = 'float8',
	'ABSTIME'          = 'abstime',
	'RELTIME'          = 'reltime',
	'TINTERVAL'        = 'tinterval',
	'UNKNOWN'          = 'unknown',
	'CIRCLE'           = 'circle',
	'_CIRCLE'          = '_circle',
	'MONEY'            = 'money',
	'_MONEY'           = '_money',
	'MACADDR'          = 'macaddr',
	'INET'             = 'inet',
	'_BOOL'            = '_bool',
	'_BYTEA'           = '_bytea',
	'_CHAR'            = '_char',
	'_NAME'            = '_name',
	'_INT2'            = '_int2',
	'_INT2VECTOR'      = '_int2vector',
	'_INT4'            = '_int4',
	'_REGPROC'         = '_regproc',
	'_TEXT'            = '_text',
	'_TID'             = '_tid',
	'_XID'             = '_xid',
	'_CID'             = '_cid',
	'_OIDVECTOR'       = '_oidvector',
	'_BPCHAR'          = '_bpchar',
	'_VARCHAR'         = '_varchar',
	'_INT8'            = '_int8',
	'_POINT'           = '_point',
	'_LSEG'            = '_lseg',
	'_PATH'            = '_path',
	'_BOX'             = '_box',
	'_FLOAT4'          = '_float4',
	'_FLOAT8'          = '_float8',
	'_ABSTIME'         = '_abstime',
	'_RELTIME'         = '_reltime',
	'_TINTERVAL'       = '_tinterval',
	'_POLYGON'         = '_polygon',
	'_OID'             = '_oid',
	'ACLITEM'          = 'aclitem',
	'_ACLITEM'         = '_aclitem',
	'_MACADDR'         = '_macaddr',
	'_INET'            = '_inet',
	'BPCHAR'           = 'bpchar',
	'VARCHAR'          = 'varchar',
	'DATE'             = 'date',
	'TIME'             = 'time',
	'TIMESTAMP'        = 'timestamp',
	'_TIMESTAMP'       = '_timestamp',
	'_DATE'            = '_date',
	'_TIME'            = '_time',
	'TIMESTAMPTZ'      = 'timestamptz',
	'_TIMESTAMPTZ'     = '_timestamptz',
	'INTERVAL'         = 'interval',
	'_INTERVAL'        = '_interval',
	'_NUMERIC'         = '_numeric',
	'PG_DATABASE'      = 'pg_database',
	'_CSTRING'         = '_cstring',
	'TIMETZ'           = 'timetz',
	'_TIMETZ'          = '_timetz',
	'BIT'              = 'bit',
	'_BIT'             = '_bit',
	'VARBIT'           = 'varbit',
	'_VARBIT'          = '_varbit',
	'NUMERIC'          = 'numeric',
	'REFCURSOR'        = 'refcursor',
	'_REFCURSOR'       = '_refcursor',
	'REGPROCEDURE'     = 'regprocedure',
	'REGOPER'          = 'regoper',
	'REGOPERATOR'      = 'regoperator',
	'REGCLASS'         = 'regclass',
	'REGTYPE'          = 'regtype',
	'_REGPROCEDURE'    = '_regprocedure',
	'_REGOPER'         = '_regoper',
	'_REGOPERATOR'     = '_regoperator',
	'_REGCLASS'        = '_regclass',
	'_REGTYPE'         = '_regtype',
	'RECORD'           = 'record',
	'CSTRING'          = 'cstring',
	'ANY'              = 'any',
	'ANYARRAY'         = 'anyarray',
	'VOID'             = 'void',
	'TRIGGER'          = 'trigger',
	'LANGUAGE_HANDLER' = 'language_handler',
	'INTERNAL'         = 'internal',
	'OPAQUE'           = 'opaque',
	'ANYELEMENT'       = 'anyelement',
	'_RECORD'          = '_record',
	'ANYNONARRAY'      = 'anynonarray',
	'PG_AUTHID'        = 'pg_authid',
	'PG_AUTH_MEMBERS'  = 'pg_auth_members',
	'_TXID_SNAPSHOT'   = '_txid_snapshot',
	'UUID'             = 'uuid',
	'_UUID'            = '_uuid',
	'TXID_SNAPSHOT'    = 'txid_snapshot',
	'FDW_HANDLER'      = 'fdw_handler',
	'PG_LSN'           = 'pg_lsn',
	'_PG_LSN'          = '_pg_lsn',
	'TSM_HANDLER'      = 'tsm_handler',
	'ANYENUM'          = 'anyenum',
	'TSVECTOR'         = 'tsvector',
	'TSQUERY'          = 'tsquery',
	'GTSVECTOR'        = 'gtsvector',
	'_TSVECTOR'        = '_tsvector',
	'_GTSVECTOR'       = '_gtsvector',
	'_TSQUERY'         = '_tsquery',
	'REGCONFIG'        = 'regconfig',
	'_REGCONFIG'       = '_regconfig',
	'REGDICTIONARY'    = 'regdictionary',
	'_REGDICTIONARY'   = '_regdictionary',
	'JSONB'            = 'jsonb',
	'_JSONB'           = '_jsonb',
	'ANYRANGE'         = 'anyrange',
	'EVENT_TRIGGER'    = 'event_trigger',
	'INT4RANGE'        = 'int4range',
	'_INT4RANGE'       = '_int4range',
	'NUMRANGE'         = 'numrange',
	'_NUMRANGE'        = '_numrange',
	'TSRANGE'          = 'tsrange',
	'_TSRANGE'         = '_tsrange',
	'TSTZRANGE'        = 'tstzrange',
	'_TSTZRANGE'       = '_tstzrange',
	'DATERANGE'        = 'daterange',
	'_DATERANGE'       = '_daterange',
	'INT8RANGE'        = 'int8range',
	'_INT8RANGE'       = '_int8range',
	'PG_SHSECLABEL'    = 'pg_shseclabel',
	'REGNAMESPACE'     = 'regnamespace',
	'_REGNAMESPACE'    = '_regnamespace',
	'REGROLE'          = 'regrole',
	'_REGROLE'         = '_regrole',
}


/**
 * parameters format codes
 * 0x00 = 'text, text mode
 * 0x01 = 'binary', binary mode
 */
export const enum PARAMETER_FORMAT_CODE {
    TEXT = 0x00,
    BINARY = 0x01,
}


/**
 * portal or statement
 * 'P' = portal;
 * 'S' = prepared statement; 
 */
export const enum PORTAL_STATEMENT_TYPE {
    PORTAL    = 0x50, // 'P'
    STATEMENT = 0x53, // 'S'
}


/** 
 * current backend transaction status indicator. Possible values are: 
 * 0x49 = 73 = 'I' if idle (not in a transaction block); 
 * 0x54 = 84 = 'T' if in a transaction block; 
 * 0x45 = 69 = 'E' if in a failed transaction block (queries will be rejected until block is ended)
 */
export const enum TRANSACTION_STATUS {
    Idle                = 0x49,
    IdleInTransaction   = 0x54,
    InFailedTransaction = 0x45,
}