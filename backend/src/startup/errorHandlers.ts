import { Application } from "express";
import errorHandler from "../middleware/error";

export function setupErrorHandling(app: Application): void {
  app.use(errorHandler); // Express middleware last
}