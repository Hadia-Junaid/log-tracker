//export a function that acts as an error handler middleware, logs the error and sends a response
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { isMongoDuplicateKeyError } from "../utils/checkErrors";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.message, err);

  // Handle duplicate key errors from MongoDB
  if (isMongoDuplicateKeyError(err)) {
    logger.warn(
      `Duplicate key error for application name: ${err.keyValue?.name}`
    );
    res.status(409).json({ error: "Application name must be unique" });
    return;
  }

  res.status(500).json({ error: err.message || "Internal Server Error" });
};

export default errorHandler;
