import { Request, Response } from "express";
import User from "../models/User";
import Application from "../models/Application";
import UserGroup from "../models/UserGroup";
import Log from "../models/Log";
import logger from '../utils/logger';
import AtRiskRule from "../models/AtRiskRule";

// Pinned applications endpoints

export const getPinnedApps = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    logger.info(`Fetching pinned applications for user: ${userId}`);

    if (!userId) {
        logger.warn("Unauthorized: User ID is required to get pinned apps");
        res.status(401).json({ error: "User ID is required" });
        return;
    }
    const user = await User.findById(userId).lean();

    if (!user) {
        logger.warn(`User not found: ${userId}`);
        res.status(404).json({ error: 'User not found' });
        return;
    }

    const pinnedApps = user.pinned_applications;
    logger.info(`User ${userId} has ${pinnedApps?.length || 0} pinned applications`);

    if (!pinnedApps || pinnedApps.length === 0) {
        res.status(200).json({ pinned_applications: [] });
        return;
    }

    const appNames = await Application.find({
        _id: { $in: pinnedApps }
    }).select('name').lean();

    const logStats = await Log.aggregate([
        {
            $match: {
                application_id: { $in: pinnedApps }
            }
        },
        {
            $group: {
                _id: {
                    application_id: '$application_id',
                    log_level: '$log_level'
                },
                count: { $sum: 1 }
            }
        }
    ]);

    const logCountsMap: Record<string, Record<string, number>> = {};
    for (const stat of logStats) {
        const appId = String(stat._id.application_id); // Ensure key is a string
        const level = stat._id.log_level.toUpperCase();
        const count = stat.count;

        if (!logCountsMap[appId]) {
            logCountsMap[appId] = {};
        }
        logCountsMap[appId][level] = count;
    }

    // Build response array with log counts
    const response = pinnedApps.map((appId: any) => ({
        _id: appId.toString(),
        appName: appNames.find(a => a._id.toString() === appId.toString())?.name || 'Unknown', 
        logCounts: logCountsMap[appId.toString()] || {}
    }));

    res.status(200).json({ pinned_applications: response });
    return;
};

export const updatePinnedApps = async (req: Request, res: Response): Promise<void> => {
  const { id, appId: singleAppId } = req.params;

  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    logger.warn(`Invalid userId: ${id}`);
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  try {
    // If appId is passed → handle single unpin
    if (singleAppId) {
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $pull: { pinned_applications: singleAppId } },
        { new: true }
      ).populate('pinned_applications', 'name description');

      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({
        message: "Pinned application removed successfully",
        pinned_applications: updatedUser.pinned_applications,
      });
      return;
    }

    const { appIds } = req.body;

    // Bulk update logic
    if (!Array.isArray(appIds)) {
      res.status(400).json({ error: "appIds must be an array" });
      return;
    }

    const validAppIds = await Application.find({ _id: { $in: appIds } }).distinct("_id");

    if (validAppIds.length !== appIds.length) {
      res.status(400).json({ error: "One or more applications do not exist" });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { pinned_applications: appIds },
      { new: true }
    ).populate('pinned_applications', 'name description');

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Pinned applications updated successfully',
      pinned_applications: updatedUser.pinned_applications
    });

  } catch (error) {
    logger.error(`Failed to update pinned apps for user ${id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch Active Applications

export const getActiveApps = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    logger.info(`Fetching active applications for user: ${userId}`);

    if (!userId) {
        logger.warn("User ID is required to get active apps");
        res.status(400).json({ error: "User ID is required" });
        return;
    }

    // 1. Get the user
    const user = await User.findById(userId).lean();
    if (!user) {
        logger.warn(`User not found: ${userId}`);
        res.status(404).json({ error: "User not found" });
        return;
    }

    // 2. Find user groups the user belongs to
    const userGroups = await UserGroup.find({ members: user._id }).lean();
    logger.info(`Found ${userGroups.length} user groups for user: ${userId}`);
    if (!userGroups.length) {
        logger.info(`No user groups found for user: ${userId}`);
        res.status(200).json({ active_applications: [] });
        return;
    }

    // 3. Collect all assigned application IDs from user groups
    const assignedAppIds = [
        ...new Set(userGroups.flatMap(group => group.assigned_applications.map(id => id.toString())))
    ];
    logger.info(`Found ${assignedAppIds.length} assigned applications for user: ${userId}`);

    if (!assignedAppIds.length) {
        logger.info(`No assigned applications for user groups of user: ${userId}`);
        res.status(200).json({ active_applications: [] });
        return;
    }

    // 4. Fetch applications where isActive is true
    const activeApps = await Application.find({
        _id: { $in: assignedAppIds },
        isActive: true
    }).lean();
    logger.info(`Found ${activeApps.length} active applications for user: ${userId}`);

    if (!activeApps.length) {
        logger.info(`No active applications found for user: ${userId}`);
        res.status(200).json({ active_applications: [] });
        return;
    }

    // 5. Count logs for each app in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs = await Log.aggregate([
        {
            $match: {
                application_id: { $in: activeApps.map(app => app._id) },
                timestamp: { $gte: since }
            }
        },
        {
            $group: {
                _id: "$application_id",
                totalLogs: { $sum: 1 }
            }
        }
    ]);

    const logCountMap: Record<string, number> = {};
    logs.forEach(log => {
        logCountMap[log._id.toString()] = log.totalLogs;
    });

    // 6. Build response
    const response = activeApps.map(app => ({
        _id: app._id,
        name: app.name,
        description: app.description,
        totalLogsLast24h: logCountMap[app._id.toString()] || 0
    }));

    logger.info(`Active applications fetched for user: ${userId}`);
    res.status(200).json({ active_applications: response });
};

const unitInMinutes = {
  Minutes: 1,
  Hours: 60,
  Days: 1440
} as const;

type TimeUnit = keyof typeof unitInMinutes;

function isValidUnit(unit: string): unit is TimeUnit {
  return unit in unitInMinutes;
}

export const getAtRiskApps = async (req: Request, res: Response): Promise<void> => {
  try {
    const apps = await Application.find({ isActive: true });
    const rules = await AtRiskRule.find();

    const atRiskResults = [];

    for (const app of apps) {
      const messages: string[] = [];

      for (const rule of rules) {
        const { type_of_logs, operator, unit, time, number_of_logs } = rule;

        if (!isValidUnit(unit)) {
          logger.warn(`Skipping rule with invalid unit: ${unit}`);
          continue;
        }

        const minutes = time * unitInMinutes[unit];
        const timeThreshold = new Date(Date.now() - minutes * 60 * 1000);

        const logs = await Log.find({
          application_id: app._id,
          log_level: type_of_logs,
          timestamp: { $gte: timeThreshold }
        });

        if (operator === 'greater' && logs.length > number_of_logs) {
          messages.push(
            `Too many '${type_of_logs}' logs in past ${time} ${unit}(s): ${logs.length} > ${number_of_logs}`
          );
        } else if (operator === 'less' && logs.length < number_of_logs) {
          messages.push(
            `Too few '${type_of_logs}' logs in past ${time} ${unit}(s): ${logs.length} < ${number_of_logs}`
          );
        } else if (operator === 'equal' && logs.length === number_of_logs) {
          messages.push(
            `'${type_of_logs}' logs exactly equal to ${number_of_logs} in past ${time} ${unit}(s)`
          );
        }
      }

      if (messages.length > 0) {
        atRiskResults.push({
          appId: app._id,
          name: app.name,
          messages
        });
      }
    }

    logger.info(`Found ${atRiskResults.length} at-risk applications`);
    res.status(200).json({ at_risk_applications: atRiskResults });
  } catch (error) {
    logger.error("Failed to evaluate at-risk applications", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};