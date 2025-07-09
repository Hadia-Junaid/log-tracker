import { Request, Response } from 'express';
import User from '../models/User';
import AtRiskRule from '../models/AtRiskRule';
import logger from '../utils/logger';
import mongoose from "mongoose";

// Get user settings by ID for Auto Refresh and Logs Per Page
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

  logger.info(`Fetched settings for user: ${user.email}`);
  res.status(200).json(settings);
};

// Update user settings for Auto Refresh and Logs Per Page
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

  logger.info(`Updated settings for user: ${updatedUser.email}`);
  res.status(200).json(updatedUser.settings);
};

// Reset user settings to default values for Auto Refresh and Logs Per Page
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

  logger.info(`Reset settings to default for user: ${updatedUser.email}`);
  res.status(200).json({ message: 'Settings reset to default.' });
};

// GET /api/at-risk-rules
export const getAllAtRiskRules = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rules = await AtRiskRule.find();
  logger.info('✅ Fetched all at-risk rules');
  res.status(200).json(rules);
};

// GET /api/at-risk-rules/:id
export const getAtRiskRuleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const ruleId = req.params.id;

  if (!ruleId || !mongoose.Types.ObjectId.isValid(ruleId)) {
    res.status(400).json({ error: 'Invalid rule ID.' });
    return;
  }

  const rule = await AtRiskRule.findById(ruleId);

  if (!rule) {
    res.status(404).json({ error: 'Rule not found.' });
    return;
  }

  logger.info(`✅ Fetched at-risk rule: ${ruleId}`);
  res.status(200).json(rule);
};

// POST /api/at-risk-rules
export const createAtRiskRule = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { type_of_logs, operator, unit, time, number_of_logs } = req.body;

  if (
    typeof type_of_logs !== 'string' ||
    typeof operator !== 'string' ||
    typeof unit !== 'string' ||
    typeof time !== 'number' ||
    typeof number_of_logs !== 'number'
  ) {
    res.status(400).json({ error: 'Invalid request body. Please check field types.' });
    return;
  }

  // ❗ Check for duplicate rule
  const existingRule = await AtRiskRule.findOne({ type_of_logs, operator });
  if (existingRule) {
    res.status(409).json({ error: 'A rule with the same type_of_logs and operator already exists.' });
    return;
  }

  const rule = await AtRiskRule.create(req.body);

  logger.info('✅ Created new at-risk rule');
  res.status(201).json(rule);
};


// PATCH /api/at-risk-rules/:id
export const updateAtRiskRule = async (
  req: Request,
  res: Response
): Promise<void> => {
  const ruleId = req.params.id;
  const { type_of_logs, operator, unit, time, number_of_logs } = req.body;

  if (!ruleId || !mongoose.Types.ObjectId.isValid(ruleId)) {
    res.status(400).json({ error: 'Invalid rule ID.' });
    return;
  }

  if (
    typeof type_of_logs !== 'string' ||
    typeof operator !== 'string' ||
    typeof unit !== 'string' ||
    typeof time !== 'number' ||
    typeof number_of_logs !== 'number'
  ) {
    res.status(400).json({ error: 'Invalid request body. Please check field types.' });
    return;
  }

  // ❗ Check for duplicates excluding current rule
  const duplicate = await AtRiskRule.findOne({
    _id: { $ne: ruleId },
    type_of_logs,
    operator
  });

  if (duplicate) {
    res.status(409).json({ error: 'Another rule with the same type_of_logs and operator already exists.' });
    return;
  }

  const updatedRule = await AtRiskRule.findByIdAndUpdate(ruleId, req.body, { new: true });

  if (!updatedRule) {
    res.status(404).json({ error: 'Rule not found.' });
    return;
  }

  logger.info(`✅ Updated at-risk rule: ${ruleId}`);
  res.status(200).json(updatedRule);
};


// DELETE /api/at-risk-rules/:id
export const deleteAtRiskRule = async (
  req: Request,
  res: Response
): Promise<void> => {
  const ruleId = req.params.id;

  if (!ruleId || !mongoose.Types.ObjectId.isValid(ruleId)) {
    res.status(400).json({ error: 'Invalid rule ID.' });
    return;
  }

  const deleted = await AtRiskRule.findByIdAndDelete(ruleId);

  if (!deleted) {
    res.status(404).json({ error: 'Rule not found.' });
    return;
  }

  logger.info(`🗑️ Deleted at-risk rule: ${ruleId}`);
  res.status(200).json({ message: 'Rule deleted successfully.' });
};
