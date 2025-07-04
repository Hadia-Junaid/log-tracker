import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../utils/logger';
import mongoose from "mongoose";

// Get user settings by ID
export const getUserSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ error: 'Invalid or missing user ID.' });
    return;
  }

  const user = await User.findById(userId);

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const settings = user.settings || {
    autoRefresh: false,
    autoRefreshTime: 30,
    logsPerPage: 10
  };

  logger.info(`✅ Fetched settings for user: ${user.email}`);
  res.status(200).json(settings);
};

// Update user settings
export const updateUserSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;
  const { autoRefresh, logsPerPage, autoRefreshTime } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ error: 'Invalid or missing user ID.' });
    return;
  }

  if (
    typeof autoRefresh !== 'boolean' ||
    typeof logsPerPage !== 'number' ||
    typeof autoRefreshTime !== 'number'
  ) {
    res.status(400).json({
      error: '`autoRefresh` must be boolean, `logsPerPage` and `autoRefreshTime` must be numbers.'
    });
    return;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'settings.autoRefresh': autoRefresh,
        'settings.autoRefreshTime': autoRefreshTime,
        'settings.logsPerPage': logsPerPage
      }
    },
    { new: true }
  );

  if (!updatedUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  logger.info(`✅ Updated settings for user: ${updatedUser.email}`);
  res.status(200).json(updatedUser.settings);
};

// Reset user settings to default values
export const resetUserSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;

  // Validate ID
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ error: 'Invalid or missing user ID.' });
    return;
  }

  // Reset settings to default
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'settings.autoRefresh': false,
        'settings.autoRefreshTime': 30,
        'settings.logsPerPage': 10
      }
    },
    { new: true }
  );

  if (!updatedUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  logger.info(`♻️ Reset settings to default for user: ${updatedUser.email}`);
  res.status(200).json({ message: 'Settings reset to default.' });
};
