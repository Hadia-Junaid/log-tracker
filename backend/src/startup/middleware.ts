import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requestLogger } from "../middleware/requestLogger";
import config from "./config";

export function setupMiddleware(app: express.Application): void {
  const baseUrl = config.get<string>("frontend.baseUrl");

  app.use(cookieParser());

  app.use(
    cors({
      origin: baseUrl,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(requestLogger);
}
