import logger from "../utils/logger";

export const processErrors = function () {

  // Log uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (err) => {
    logger.error(`[Uncaught Exception] ${err}`);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise) => {
    logger.error('[Unhandled Rejection]', reason);
    process.exit(1);
  });
}
