import mongoose from "mongoose";
import logger from "../utils/logger";
import config from "./config";
import { ensureTTLIndex } from "../utils/initTTLIndex";

export async function connectToDatabase(): Promise<void> {
  try {
    const mongoUri = config.get<string>("mongoUri");
    await mongoose.connect(mongoUri);
    logger.info("MongoDB connected");
    await ensureTTLIndex();
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    setTimeout(() => {
      process.exit(1);
    }, 500);  }
}