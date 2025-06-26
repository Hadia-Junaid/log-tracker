//export a function that acts as an error handler middleware, logs the error and sends a response
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, err);
  
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};

export default errorHandler;