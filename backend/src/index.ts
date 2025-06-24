import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './utils/logger'; 
import errorHandler from './middleware/error';
import { processErrors } from './startup/processErrors';


processErrors(); // Initialize global error handlers

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    logger.info('MongoDB connected');
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
  });

app.get('/', (req, res) => {
  res.send('API is running!');
});

app.use(errorHandler);