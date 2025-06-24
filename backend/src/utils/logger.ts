// src/utils/logger.ts
import winston from 'winston';

const { combine, printf, timestamp } = winston.format;

// Define custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] [trace-id-placeholder] ${message}\n`;
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// Export logger and stream for morgan (optional)
export default logger;
