const { createLogger, format, transports } = require('winston');
const path = require('path');

const customFormat = format.printf(({ level, message, traceid, timestamp }) => {
  const traceId = traceid || 'unknown';
  const msg =
    typeof message === 'object'
      ? Object.entries(message)
          .filter(([k]) => k !== 'traceid')
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(' ')
      : message;

  return `[${timestamp}] [${level.toUpperCase()}] [${traceId}]${msg}`;
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
