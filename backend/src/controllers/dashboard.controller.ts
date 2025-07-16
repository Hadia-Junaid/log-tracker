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

    // Get user's active applications to validate pinned apps
    const userGroups = await UserGroup.find({ members: user._id }).lean();
    const assignedAppIds = userGroups.length > 0 ? [
        ...new Set(userGroups.flatMap(group => group.assigned_applications.map(id => id.toString())))
    ] : [];

    const activeApps = await Application.find({
        _id: { $in: assignedAppIds },
        isActive: true
    }).lean();

    const activeAppIds = activeApps.map(app => app._id.toString());
    logger.info(`User ${userId} has ${activeAppIds.length} active applications`);

    // Filter out pinned apps that are no longer active
    const validPinnedApps = pinnedApps.filter(appId => 
        activeAppIds.includes(appId.toString())
    );

    // If any pinned apps were removed, update the user's pinned_applications
    if (validPinnedApps.length !== pinnedApps.length) {
        const removedCount = pinnedApps.length - validPinnedApps.length;
        logger.info(`Removing ${removedCount} invalid pinned applications for user ${userId}`);
        
        await User.findByIdAndUpdate(userId, {
            pinned_applications: validPinnedApps
        });
    }

    if (validPinnedApps.length === 0) {
        res.status(200).json({ pinned_applications: [] });
        return;
    }

    const appNames = await Application.find({
        _id: { $in: validPinnedApps }
    }).select('name').lean();

    const logStats = await Log.aggregate([
        {
            $match: {
                application_id: { $in: validPinnedApps }
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
    const response = validPinnedApps.map((appId: any) => ({
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

  
};

export const cleanupPinnedApps = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id;
  logger.info(`Cleaning up pinned applications for user: ${userId}`);

  if (!userId) {
    logger.warn("User ID is required to cleanup pinned apps");
    res.status(400).json({ error: "User ID is required" });
    return;
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    logger.warn(`User not found: ${userId}`);
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const pinnedApps = user.pinned_applications;
  if (!pinnedApps || pinnedApps.length === 0) {
    res.status(200).json({ 
      message: 'No pinned applications to cleanup',
      removed_count: 0,
      remaining_count: 0
    });
    return;
  }

  // Get user's active applications
  const userGroups = await UserGroup.find({ members: user._id }).lean();
  const assignedAppIds = userGroups.length > 0 ? [
    ...new Set(userGroups.flatMap(group => group.assigned_applications.map(id => id.toString())))
  ] : [];

  const activeApps = await Application.find({
    _id: { $in: assignedAppIds },
    isActive: true
  }).lean();

  const activeAppIds = activeApps.map(app => app._id.toString());

  // Filter out pinned apps that are no longer active
  const validPinnedApps = pinnedApps.filter(appId => 
    activeAppIds.includes(appId.toString())
  );

  const removedCount = pinnedApps.length - validPinnedApps.length;

  if (removedCount > 0) {
    logger.info(`Removing ${removedCount} invalid pinned applications for user ${userId}`);
    
    await User.findByIdAndUpdate(userId, {
      pinned_applications: validPinnedApps
    });
  }

  res.status(200).json({
    message: `Cleaned up ${removedCount} invalid pinned applications`,
    removed_count: removedCount,
    remaining_count: validPinnedApps.length,
    pinned_applications: validPinnedApps
  });
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
    response.sort((a, b) => b.totalLogsLast24h - a.totalLogsLast24h);
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
  const rules = await AtRiskRule.find();

  const userId = req.params.id;
    logger.info(`Fetching at-risk applications for user: ${userId}`);

    if (!userId) {
        logger.warn("User ID is required to get at-risk apps");
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


  if (!rules.length || !activeApps.length) {
    res.status(200).json({ at_risk_applications: [] });
    return;
  }

  const appIdSet = new Set(activeApps.map(app => app._id.toString()));

  // Build match stages from all rules
  const orConditions = rules
    .filter(rule => isValidUnit(rule.unit))
    .map(rule => {
      const minutes = rule.time * unitInMinutes[rule.unit as TimeUnit];
      const timeThreshold = new Date(Date.now() - minutes * 60 * 1000);

      return {
        log_level: rule.type_of_logs,
        timestamp: { $gte: timeThreshold }
      };
    });

  if (!orConditions.length) {
    logger.warn("No valid at-risk rules found");
    res.status(200).json({ at_risk_applications: [] });
    return;
  }

  const aggregationResult = await Log.aggregate([
    {
      $match: {
        $or: orConditions,
        application_id: { $in: activeApps.map(app => app._id) }
      }
    },
    {
      $group: {
        _id: {
          application_id: "$application_id",
          log_level: "$log_level"
        },
        count: { $sum: 1 }
      }
    }
  ]);

  // Build a lookup table: { appId -> { log_level -> count } }
  const logCountMap: Record<string, Record<string, number>> = {};
  for (const entry of aggregationResult) {
    const appId = entry._id.application_id.toString();
    const level = entry._id.log_level.toUpperCase();
    const count = entry.count;

    if (!logCountMap[appId]) logCountMap[appId] = {};
    logCountMap[appId][level] = count;
  }

  // Evaluate apps against rules
  const atRiskResults = [];

  for (const app of activeApps) {
    const appLogs = logCountMap[app._id.toString()] || {};
    const messages: string[] = [];

    for (const rule of rules) {
      if (!isValidUnit(rule.unit)) continue;

      const level = rule.type_of_logs.toUpperCase();
      const actualCount = appLogs[level] || 0;

      if (
        (rule.operator === "greater" && actualCount > rule.number_of_logs) ||
        (rule.operator === "less" && actualCount < rule.number_of_logs) ||
        (rule.operator === "equal" && actualCount === rule.number_of_logs)
      ) {
        messages.push(
          `Log level '${rule.type_of_logs}' has ${actualCount} logs in past ${rule.time} ${rule.unit}(s) — rule requires '${rule.operator}' ${rule.number_of_logs}`
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
};
