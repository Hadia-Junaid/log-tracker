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

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

let logId = 0;

function logBatch() {
  logger.info({
    id: logId++,
    traceid: 'abcd1234',
    message: messages[getRandomInt(messages.length)]
  });

  setTimeout(logBatch, 1000); // Log one message every second
}

logBatch(); // Start logging
