// Copyright 2021 mywaiting. All rights reserved.

export {
    encode, decode,
    readInt8BE, readInt16BE, readInt32BE,
    readUint8BE, readUint16BE, readUint32BE,
    BufferReader, BufferWriter
} from './buffer.ts'

export { 
    Client, Pool, ClientOptionsReader
} from './client.ts'
export type { 
    ClientOptions 
} from './client.ts'

export {
    SSL_STATUS,
    Connection 
} from './connection.ts'
export type { 
    ConnectionOptions 
} from './connection.ts'

export {
    MESSAGE_CODE, MESSAGE_NAME,
    AUTHENTICATION_CODE,
    ERROR_MESSAGE, NOTICE_MESSAGE,
    OID_TYPE_CODE, OID_TYPE_NAME,
    PARAMETER_FORMAT_CODE,
    PORTAL_STATEMENT_TYPE,
    TRANSACTION_STATUS
} from './constants.ts'

export {
    Cursor, ArrayCursor, ObjectCursor,
    QueryOptions, 
    QueryResult, ArrayQueryResult, ObjectQueryResult, QueryResultType
} from './cursor.ts'
export type {
    CursorOptions,
    EncodedParameter,
    ArrayQueryOptions, ObjectQueryOptions,
} from './cursor.ts'

export {
    deferred, DeferredStack
} from './deferred.ts'
export type {
    Deferred
} from './deferred.ts'

export {
    ERROR_CLASSES_MAP, ERROR_CODE_MAP,
    OperationalError,
    NotSupportedError,
    ProgrammingError,
    DataError,
    IntegrityError,
    TransactionRollbackError,
    QueryCanceledError,
    InternalError,
    postgresErrorCode,
    postgresRaiseError,
    AuthenticationError,
    ConnectionError,
    PacketError,
    QueryError
} from './error.ts'

export {
    dumpPacket,
    PacketReader,
    AuthenticationReader,
    BackendKeyDataReader,
    BindCompleteReader,
    CloseCompleteReader,
    CommandCompleteReader,
    CopyDataReader,
    CopyDoneReader,
    CopyInResponseReader,
    CopyOutResponseReader,
    CopyBothResponseReader,
    DataRowReader,
    EmptyQueryResponseReader,
    ErrorResponseReader,
    FunctionCallResponseReader,
    NegotiateProtocolVersionReader,
    NoDataReader,
    NoticeResponseReader,
    NotificationResponseReader,
    ParameterDescriptionReader,
    ParameterStatusReader,
    ParseCompleteReader,
    PortalSuspendedReader,
    ReadyForQueryReader,
    RowDescriptionReader,
    PacketWriter,
    BindWriter,
    CancelRequestWriter,
    CloseWriter,
    CopyDataWriter,
    CopyDoneWriter,
    CopyFailWriter,
    DescribeWriter,
    ExecuteWriter,
    FlushWriter,
    FunctionCallWriter,
    GSSResponseWriter,
    ParseWriter,
    PasswordMessageWriter,
    QueryWriter,
    SASLInitialResponseWriter,
    SASLResponseWriter,
    SSLRequestWriter,
    GSSENCRequestWriter,
    StartupWriter,
    SyncWriter,
    TerminateWriter
} from './protocol.ts'

export {
    TypeReader,
    TypeWriter,
    ArrayParser
} from './types.ts'
export type {
    Box,
    Circle,
    Float4,
    Float8,
    Line,
    LineSegment,
    Path,
    Point,
    Polygon,
    TID,
    Timestamp,
} from './types.ts'