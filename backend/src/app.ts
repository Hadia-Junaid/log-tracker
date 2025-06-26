import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userGroupRoutes from './routes/userGroup.route';
import logger from './utils/logger';
import errorHandler from './middleware/error'; 
dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use('/api/user-groups', userGroupRoutes);

app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error', err));

export default app;
