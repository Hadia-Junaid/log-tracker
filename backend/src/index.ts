import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import logger, {morganStream} from "./utils/logger";
import errorHandler from "./middleware/error";
import { processErrors } from "./startup/processErrors";
import config from "config";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import cors from "cors";

processErrors(); // Initialize process level error handlers

const PORT = config.get<number>("server.port") || 3000;
const mongoUri = config.get<string>("mongoUri") || "";

const app = express();

app.use(express.json());
app.use(morgan('tiny', { stream: morganStream }));

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:8000', // Frontend URL
  credentials: true
}));

// Authentication routes
app.use('/auth', authRoutes);

mongoose.connect(mongoUri)
  .then(() => {
    logger.info("MongoDB connected");
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
  });

app.get("/", (req, res) => {
  res.send("API is running!");
});

// Error handling middleware to catch unhandled errors
app.use(errorHandler);