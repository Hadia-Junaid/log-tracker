import mongoose from "mongoose";
import logger from "../utils/logger";
import config from "./config";
import { ensureTTLIndex } from "../utils/initTTLIndex";

export async function connectToDatabase(): Promise<void> {
  const mongoUri = config.get<string>("mongoUri");

  logger.debug(`Mongo URI: ${mongoUri}`);

    await mongoose.connect(mongoUri);
    logger.info("MongoDB connected");

    await ensureTTLIndex();
}
