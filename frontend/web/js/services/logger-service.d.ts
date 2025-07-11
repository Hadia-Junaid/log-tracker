export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
declare class LoggerService {
    private logLevel;
    private traceId;
    constructor();
    private getLogLevel;
    private detectEnvironment;
    private generateTraceId;
    private formatTimestamp;
    private formatLogMessage;
    private shouldLog;
    private logToConsole;
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
    setTraceId(traceId: string): void;
    getTraceId(): string;
}
export declare const logger: LoggerService;
export default logger;
