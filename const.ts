

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
    BackendKeyData  = 0x4b, // 'K'
    Bind            = 0x42, // 'B'
    BindComplete    = 0x32, // '2'
    // CancelRequest = 'CancelRequest',
    Close           = 0x43, // 'C'
    CloseComplete   = 0x33, // '3'
    CommandComplete = 0x43, // 'C'
    CopyData        = 0x64, // 'd'
    CopyDone        = 0x63, // 'c'
    CopyFail        = 0x66, // 'f'
    CopyInResponse     = 0x47, // 'G'
    CopyOutResponse    = 0x48, // 'H'
    CopyBothResponse   = 0x57, // 'W'
    DataRow            = 0x44, // 'D'
    Describe           = 0x44,
    EmptyQueryResponse = 0x49, // 'I'
    ErrorResponse      = 0x45, // 'E'
    Execute            = 0x45,
    Flush              = 0x48, // 'H'
    FunctionCall       = 0x46, // 'F'
    FunctionCallResponse     = 0x56, // 'V'
    GSSResponse              = 0x70, // 'p'
    NegotiateProtocolVersion = 0x76, // 'v'
    NoData               = 0x6e, // 'n'
    NoticeResponse       = 0x4e, // 'N'
    NotificationResponse = 0x41, // 'A'
    ParameterDescription = 0x74, // 't'
    ParameterStatus      = 0x53, // 'S'
    Parse                = 0x50, // 'P'
    ParseComplete        = 0x31, // '1'
    PasswordMessage      = 0x70, // 'p'
    PortalSuspended      = 0x73, // 's'
    Query                = 0x51, // 'Q'
    ReadyForQuery        = 0x5a, // 'Z'
    RowDescription       = 0x54, // 'T'
    SASLInitialResponse  = 0x50, // 'P'
    SASLResponse         = 0x50,
    // SSLRequest = 'SSLRequest',
    // GSSENCRequest = 'GSSENCRequest',
    // StartupMessage = 'StartupMessage',
    Sync      = 0x53, // 'S'
    Terminate = 0x58, // 'X'
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
export const enum AUTHENTICATION {
    Ok = 0x00,
    KerberosV5 = 0x02,
    CleartextPassword = 0x03,
    MD5Password = 0x05,
    SCMCredential = 0x06,
    GSS = 0x07,
    GSSContinue = 0x08,
    SSPI = 0x09,
    SASL = 0x0a,         // 10
    SASLContinue = 0x0b, // 11
    SASLFinal = 0x0c,    // 12
}


/**
 * error and notice message fields, same as them
 * https://www.postgresql.org/docs/13/protocol-error-fields.html
 */
export const enum ERROR_MESSAGE_FIELD {
    SEVERITY = 'S', // always present.
    // SEVERITY = 'V', // present only by PostgreSQL versions 9.6 and later
    CODE     = 'C',
    MESSAGE  = 'M',
    DETAIL   = 'D',
    HINT     = 'H',
    POSITION = 'P',
    INTERNAL_POSITION = 'p',
    INTERNAL_QUERY    = 'q',
    WHERE       = 'W',
    SCHEMA      = 's',
    TABLE       = 't',
    COLUMN      = 'c',
    DATA_TYPE   = 'd',
    CONSTRAINT  = 'n',
    FILE    = 'F',
    LINE    = 'L',
    ROUTINE = 'R',
}

export const enum NOTICE_MESSAGE_FIELD {
    SEVERITY = 'S', // always present.
    // SEVERITY = 'V', // present only by PostgreSQL versions 9.6 and later
    CODE     = 'C',
    MESSAGE  = 'M',
    DETAIL   = 'D',
    HINT     = 'H',
    POSITION = 'P',
    INTERNAL_POSITION = 'p',
    INTERNAL_QUERY    = 'q',
    WHERE       = 'W',
    SCHEMA      = 's',
    TABLE       = 't',
    COLUMN      = 'c',
    DATA_TYPE   = 'd',
    CONSTRAINT  = 'n',
    FILE    = 'F',
    LINE    = 'L',
    ROUTINE = 'R',
}