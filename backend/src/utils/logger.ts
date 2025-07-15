import winston from 'winston';
import config from 'config';

const { combine, printf, timestamp } = winston.format;

// Define custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] [trace-id-placeholder]${message}\n`;
});

const env = config.get<string>('environment') || 'development';

// Set level: 'debug' in production, 'info' otherwise
const logLevel = env === 'production' ? 'info' : 'debug';

// Create the logger
const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// Export the logger instance
export default logger;
