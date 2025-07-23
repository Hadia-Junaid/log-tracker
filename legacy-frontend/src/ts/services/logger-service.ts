/**
 * Frontend Logger Service
 * Mimics backend winston logger behavior with proper log formatting
 * Follows the pattern: [timestamp] [level] [trace-id]message
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  traceId: string;
  message: string;
  data?: any;
}

class LoggerService {
  private logLevel: LogLevel;
  private traceId: string;

  constructor() {
    // Determine log level based on environment
    this.logLevel = this.getLogLevel();
    this.traceId = this.generateTraceId();
    
    // Log initialization
    this.info('Frontend logger service initialized', {
      environment: this.detectEnvironment(),
      logLevel: LogLevel[this.logLevel],
      traceId: this.traceId
    });
  }

  private getLogLevel(): LogLevel {
    const environment = this.detectEnvironment();
    
    // In development, show all logs; in production, only warn and error
    if (environment === 'development') {
      return LogLevel.DEBUG;
    } else {
      return LogLevel.WARN;
    }
  }

  private detectEnvironment(): 'development' | 'production' {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' 
      ? 'development' 
      : 'production';
  }

  private generateTraceId(): string {
    // Generate a simple trace ID for this session
    return Math.random().toString(36).substr(2, 9);
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.getFullYear() + '-' +
           String(now.getMonth() + 1).padStart(2, '0') + '-' +
           String(now.getDate()).padStart(2, '0') + ' ' +
           String(now.getHours()).padStart(2, '0') + ':' +
           String(now.getMinutes()).padStart(2, '0') + ':' +
           String(now.getSeconds()).padStart(2, '0') + '.' +
           String(now.getMilliseconds()).padStart(3, '0');
  }

  private formatLogMessage(level: string, message: string): string {
    const timestamp = this.formatTimestamp();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.traceId}]${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private logToConsole(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatLogMessage(LogLevel[level], message);
    
    switch (level) {
      case LogLevel.DEBUG:
        if (data !== undefined) {
          console.debug(formattedMessage, data);
        } else {
          console.debug(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        if (data !== undefined) {
          console.info(formattedMessage, data);
        } else {
          console.info(formattedMessage);
        }
        break;
      case LogLevel.WARN:
        if (data !== undefined) {
          console.warn(formattedMessage, data);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case LogLevel.ERROR:
        if (data !== undefined) {
          console.error(formattedMessage, data);
        } else {
          console.error(formattedMessage);
        }
        break;
    }
  }

  // Public API methods that match winston logger interface
  public debug(message: string, data?: any): void {
    this.logToConsole(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: any): void {
    this.logToConsole(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: any): void {
    this.logToConsole(LogLevel.WARN, message, data);
  }

  public error(message: string, data?: any): void {
    this.logToConsole(LogLevel.ERROR, message, data);
  }

  // Method to update trace ID for new requests/sessions
  public setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  public getTraceId(): string {
    return this.traceId;
  }
}

// Export singleton instance
export const logger = new LoggerService();
export default logger; 
