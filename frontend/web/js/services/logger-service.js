define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.logger = exports.LogLevel = void 0;
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
        LogLevel[LogLevel["INFO"] = 1] = "INFO";
        LogLevel[LogLevel["WARN"] = 2] = "WARN";
        LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    })(LogLevel || (exports.LogLevel = LogLevel = {}));
    class LoggerService {
        constructor() {
            this.logLevel = this.getLogLevel();
            this.traceId = this.generateTraceId();
            this.info('Frontend logger service initialized', {
                environment: this.detectEnvironment(),
                logLevel: LogLevel[this.logLevel],
                traceId: this.traceId
            });
        }
        getLogLevel() {
            const environment = this.detectEnvironment();
            if (environment === 'development') {
                return LogLevel.DEBUG;
            }
            else {
                return LogLevel.WARN;
            }
        }
        detectEnvironment() {
            return window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'
                ? 'development'
                : 'production';
        }
        generateTraceId() {
            return Math.random().toString(36).substr(2, 9);
        }
        formatTimestamp() {
            const now = new Date();
            return now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0') + ' ' +
                String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0') + ':' +
                String(now.getSeconds()).padStart(2, '0') + '.' +
                String(now.getMilliseconds()).padStart(3, '0');
        }
        formatLogMessage(level, message) {
            const timestamp = this.formatTimestamp();
            return `[${timestamp}] [${level.toUpperCase()}] [${this.traceId}]${message}`;
        }
        shouldLog(level) {
            return level >= this.logLevel;
        }
        logToConsole(level, message, data) {
            if (!this.shouldLog(level)) {
                return;
            }
            const formattedMessage = this.formatLogMessage(LogLevel[level], message);
            switch (level) {
                case LogLevel.DEBUG:
                    if (data !== undefined) {
                        console.debug(formattedMessage, data);
                    }
                    else {
                        console.debug(formattedMessage);
                    }
                    break;
                case LogLevel.INFO:
                    if (data !== undefined) {
                        console.info(formattedMessage, data);
                    }
                    else {
                        console.info(formattedMessage);
                    }
                    break;
                case LogLevel.WARN:
                    if (data !== undefined) {
                        console.warn(formattedMessage, data);
                    }
                    else {
                        console.warn(formattedMessage);
                    }
                    break;
                case LogLevel.ERROR:
                    if (data !== undefined) {
                        console.error(formattedMessage, data);
                    }
                    else {
                        console.error(formattedMessage);
                    }
                    break;
            }
        }
        debug(message, data) {
            this.logToConsole(LogLevel.DEBUG, message, data);
        }
        info(message, data) {
            this.logToConsole(LogLevel.INFO, message, data);
        }
        warn(message, data) {
            this.logToConsole(LogLevel.WARN, message, data);
        }
        error(message, data) {
            this.logToConsole(LogLevel.ERROR, message, data);
        }
        setTraceId(traceId) {
            this.traceId = traceId;
        }
        getTraceId() {
            return this.traceId;
        }
    }
    exports.logger = new LoggerService();
    exports.default = exports.logger;
});
//# sourceMappingURL=logger-service.js.map