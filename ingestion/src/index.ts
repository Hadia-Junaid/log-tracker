import { Worker } from "bullmq";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { logWorker } from "./workers/logWorker";
import config from "config";
import logger from "./utils/logger";

// Load the configuration
const mongoUri = config.get<string>("mongoUri") || "";
const redisConfig = config.get<{
  host: string;
  port: number;
  password: string;
}>("redisServer");

logger.debug("Redis Config:", redisConfig);
logger.info("mongo uri", mongoUri);
// Connect to MongoDB
mongoose
  .connect(mongoUri)
  .then(() => {
    logger.info("MongoDB connected successfully");
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
  });

// Create a BullMQ worker for processing log jobs
const worker = new Worker("log_bull", logWorker, {
  connection: redisConfig,
});

// Log worker events
worker.on("completed", (job) => {
  logger.info(`✅ Job ${job.id} processed`);
});

worker.on("failed", (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err}`);
});
