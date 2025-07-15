//export a function that acts as an error handler middleware, logs the error and sends a response
import { Request, Response, NextFunction } from "express";
import { isMongoDuplicateKeyError } from "../utils/checkErrors";
import logger from '../utils/logger';
import config from 'config';
import { error } from "console";

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

  const frontendBase = config.get<string>("frontend.baseUrl");

  if (req.originalUrl.includes("/google/callback")) {
    return res.redirect(
      `${frontendBase}/#login?error=auth_failed&message=${encodeURIComponent(
        err.message || "Authentication failed. Please try again."
      )}`
    );
  }


  if (req.originalUrl.includes("/status") || req.originalUrl.includes("/verify")) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  if (req.originalUrl.includes("/logout")) {
    res.status(500).json({
      error: "Logout failed. Unable to revoke tokens. Please try again.",
    });
    return;
  }

  res.status(500).json({ error: err.message || 'Internal Server Error' });
};

export default errorHandler;

