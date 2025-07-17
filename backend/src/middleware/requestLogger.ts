import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [sec, nano] = process.hrtime(start);
    const duration = (sec * 1e3 + nano / 1e6).toFixed(2);

    const logLevel =
      res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
      : 'info';

    logger.log(logLevel, `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration} ms`);
  });

  next();
};
