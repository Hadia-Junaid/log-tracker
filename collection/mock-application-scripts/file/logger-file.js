const { createLogger, format, transports } = require('winston');
const path = require('path');

const customFormat = format.printf(({ level, message, traceid, timestamp }) => {
  const traceId = traceid || 'unknown';
  return `[${timestamp}] [${level.toUpperCase()}] [traceid=${traceId}] ${message}`;
});

const logger = createLogger({
  level: 'debug', // allow all log levels
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss,SSS' }), // match console.sh format
    customFormat
  ),
  transports: [
    new transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'app.log'),
      level: 'debug', // capture all logs
    })
  ]
});

module.exports = logger;
