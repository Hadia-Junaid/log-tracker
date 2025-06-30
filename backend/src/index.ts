import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import logger, {morganStream} from "./utils/logger";
import errorHandler from "./middleware/error";
import { processErrors } from "./startup/processErrors";
import config from "config";
import morgan from "morgan";
import adminRoutes from "./routes/adminRoutes";

processErrors(); // Initialize process level error handlers

const PORT = config.get<number>("server.port");
const mongoUri = config.get<string>("mongoUri");
const frontendUrl = config.get<string>("frontendUrl");

const app = express();


const corsOptions = {
  origin: frontendUrl,
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('tiny', { stream: morganStream }));

// Register routes
app.use('/api/admin', adminRoutes);

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