const { createLogger, format, transports } = require('winston');
const path = require('path');

// Custom string format (e.g., [timestamp] level: key1=value1 key2="value2")
const customFormat = format.printf(({ level, message, timestamp }) => {
  // Handle object or string message
  const msgStr = typeof message === 'object'
    ? Object.entries(message)
        .map(([key, val]) => `${key}=${JSON.stringify(val)}`)
        .join(' ')
    : message;

  return `[${timestamp}] ${level}: ${msgStr}`;
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    customFormat
  ),
  transports: [
    new transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'app.log')
    })
  ]
});

module.exports = logger;
