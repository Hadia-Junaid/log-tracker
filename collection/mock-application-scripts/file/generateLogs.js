const logger = require('./logger-file');

const messages = [
  "User logged in",
  "File uploaded successfully",
  "Connection timeout",
  "Disk space running low",
  "Scheduled job executed",
  "Database query failed",
  "Cache cleared",
  "Service restarted",
  "Configuration updated",
  "Unexpected error occurred mocking request",
];

const logLevels = ["info", "error", "warn", "debug"];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

let logId = 0;

function logBatch() {
  const traceid = 'abcd1234';
  const message = messages[getRandomInt(messages.length)];
  const level = logLevels[getRandomInt(logLevels.length)];

  logger.log({
    level,
    message,
    traceid,
  });

  setTimeout(logBatch, 1000); // Log one message every second
}

logBatch(); // Start logging
