import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Log from "../models/Log";
import UserGroup from "../models/UserGroup";
import logger from "./logger";
import config from "config";

// This script is used to build indexes for the MongoDB collections. It needs to be run manually only once after the initial setup or when the schema changes.

async function buildIndexes() {
  const mongoUri = config.get<string>("mongoUri") || "";
  
  try {
    await mongoose.connect(mongoUri);
    logger.info("Connected to MongoDB for index building...");

    await Log.syncIndexes();
    await UserGroup.syncIndexes();
    logger.info("Indexes synced!");
    
    await mongoose.disconnect();

  } catch (err) {
    logger.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

buildIndexes();
