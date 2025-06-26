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
  "Unexpected error occurred"
];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

let logId = 0;

function logBatch() {
  const now = Date.now();
  for (let i = 0; i < 1000; i++) {
    logger.info({
      id: logId++,
      message: messages[getRandomInt(messages.length)]
    });
  }
  const elapsed = Date.now() - now;
  const delay = Math.max(0, 1000 - elapsed);
  setTimeout(logBatch, delay);  // Schedule next batch after ~1s
}

logBatch(); // Start logging
