import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file
import express from "express";
import mongoose from "mongoose";
import logger, {morganStream} from "./utils/logger";
import errorHandler from "./middleware/error";
import { processErrors } from "./startup/processErrors";
import config from "config";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/admin.route";
import userGroupRoutes from './routes/userGroup.route';
import applications from "./routes/application.routes";
import settingsRoutes from './routes/settings.Routes';    
import atRiskRuleRoutes from './routes/atRiskRule.routes';
import dashboardRoutes from "./routes/dashboard.route";
import cors from "cors";
import cookieParser from "cookie-parser";

processErrors(); // Initialize process level error handlers


const PORT = config.get<number>('server.port') || 3000;
const mongoUri = config.get<string>('mongoUri') || '';
logger.debug(`Mongo URI: ${mongoUri}`); // Log the Mongo URI for debugging
const baseUrl = config.get<string>("frontend.baseUrl");


const app = express();

// Use cookie parser to handle cookies
app.use(cookieParser());
// Enable CORS for frontend
app.use(
  cors({
    origin: baseUrl,
    credentials: true,              // allow cookies to be sent
  })
);
app.use(express.json());
app.use(morgan('tiny', { stream: morganStream }));

mongoose.connect(mongoUri)
  .then(() => {
    logger.info('MongoDB connected');
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
  });

// Log settings routes (User Settings)
app.use('/api/settings', settingsRoutes);
// At-Risk Rules routes
app.use('/api/at-risk-rules', atRiskRuleRoutes);
// Authentication routes
app.use('/api/auth', authRoutes);
// ✅ Mount the routes
app.use('/api/user-groups', userGroupRoutes);
// Register routes
app.use('/api/admin', adminRoutes);
// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);
// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/applications', applications);
// ✅ Error handler last
app.use(errorHandler);
