

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
    AuthenticationOk = 'AuthenticationOk',
    AuthenticationKerberosV5 = 'AuthenticationKerberosV5',
    AuthenticationCleartextPassword = 'AuthenticationCleartextPassword',
    AuthenticationMD5Password = 'AuthenticationMD5Password',
    AuthenticationSCMCredential = 'AuthenticationSCMCredential',
    AuthenticationGSS = 'AuthenticationGSS',
    AuthenticationSSPI = 'AuthenticationSSPI',
    AuthenticationGSSContinue = 'AuthenticationGSSContinue',
    AuthenticationSASL = 'AuthenticationSASL',
    AuthenticationSASLContinue = 'AuthenticationSASLContinue',
    AuthenticationSASLFinal = 'AuthenticationSASLFinal',
    BackendKeyData = 'BackendKeyData',
    Bind = 'Bind',
    BindComplete = 'BindComplete',
    CancelRequest = 'CancelRequest',
    Close = 'Close',
    CloseComplete = 'CloseComplete',
    CommandComplete = 'CommandComplete',
    CopyData = 'CopyData',
    CopyDone = 'CopyDone',
    CopyFail = 'CopyFail',
    CopyInResponse = 'CopyInResponse',
    CopyOutResponse = 'CopyOutResponse',
    CopyBothResponse = 'CopyBothResponse',
    DataRow = 'DataRow',
    Describe = 'Describe',
    EmptyQueryResponse = 'EmptyQueryResponse',
    ErrorResponse = 'ErrorResponse',
    Execute = 'Execute',
    Flush = 'Flush',
    FunctionCall = 'FunctionCall',
    FunctionCallResponse = 'FunctionCallResponse',
    GSSResponse = 'GSSResponse',
    NegotiateProtocolVersion = 'NegotiateProtocolVersion',
    NoData = 'NoData',
    NoticeResponse = 'NoticeResponse',
    NotificationResponse = 'NotificationResponse',
    ParameterDescription = 'ParameterDescription',
    ParameterStatus = 'ParameterStatus',
    Parse = 'Parse',
    ParseComplete = 'ParseComplete',
    PasswordMessage = 'PasswordMessage',
    PortalSuspended = 'PortalSuspended',
    Query = 'Query',
    ReadyForQuery = 'ReadyForQuery',
    RowDescription = 'RowDescription',
    SASLInitialResponse = 'SASLInitialResponse',
    SASLResponse = 'SASLResponse',
    SSLRequest = 'SSLRequest',
    GSSENCRequest = 'GSSENCRequest',
    StartupMessage = 'StartupMessage',
    Sync = 'Sync',
    Terminate = 'Terminate',
}