import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import logger, { morganStream } from './utils/logger';
import errorHandler from './middleware/error';
import { processErrors } from './startup/processErrors';
import config from 'config';
import morgan from 'morgan';
import cors from 'cors'; // 
import adminRoutes from "./routes/admin.route";

import userGroupRoutes from './routes/userGroup.route';

processErrors(); // Initialize process level error handlers

const PORT = config.get<number>('server.port') || 3000;
const mongoUri = config.get<string>('mongoUri') || '';

const app = express();

app.use(express.json());

// ✅ Configure CORS for local development
app.use(cors({
  origin: 'http://localhost:8000', // your frontend
  credentials: true
}));

app.use(morgan('tiny', { stream: morganStream }));

// ✅ Mount the routes
app.use('/api/user-groups', userGroupRoutes);


// Register routes
app.use('/api/admin', adminRoutes);

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

app.get('/', (req, res) => {
  res.send('API is running!');
});

// ✅ Error handler last
app.use(errorHandler);
