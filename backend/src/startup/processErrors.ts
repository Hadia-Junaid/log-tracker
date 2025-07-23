import logger from "../utils/logger";

function gracefulShutdownAndExit(code: number) {
  logger.info('Shutting down gracefully...');
  setTimeout(() => {
    process.exit(code);
  }, 500);
}

export const processErrors = function () {

  process.on('uncaughtException', (err) => {
    logger.error(`[Uncaught Exception] ${err.stack || err}`);
    gracefulShutdownAndExit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('[Unhandled Rejection]', reason);
    gracefulShutdownAndExit(1);
  });
}

