import { Request, Response } from "express";
import User from "../models/User";
import Application from "../models/Application";
import Log from "../models/Log";
import logger from '../utils/logger';


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

    const appNames = await Application.find({
        _id: { $in: pinnedApps.map((app: any) => app._id) }
    }).select('name').lean();

    if (!pinnedApps || pinnedApps.length === 0) {
        res.status(200).json({ pinned_applications: [] });
        return;
    }
    const logStats = await Log.aggregate([
        {
            $match: {
                application_id: { $in: pinnedApps.map((app: any) => app._id) }
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
    const response = pinnedApps.map((app: any) => ({
        _id: app._id.toString(),
        appName: appNames.find(a => a._id.toString() === app._id.toString())?.name || 'Unknown', 
        logCounts: logCountsMap[app._id.toString()] || {}
    }));

    res.status(200).json({ pinned_applications: response });
    return;
};

export const addPinnedApps = async (req: Request, res: Response): Promise<void> => {

    const { id, appId } = req.params;

    // Validate that the application exists
    const applicationExists = await Application.exists({ _id: appId });
    if (!applicationExists) {
        res.status(404).json({ message: 'Application not found' });
        return;
    }

    // Check if user exists and if app is already pinned
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        logger.warn(`Invalid userId: ${id}`);
        res.status(400).json({ error: 'Invalid userId' });
        return;
    }
    const user = await User.findById(id).select('pinned_applications');

    if (!user) {
        logger.warn(`User not found: ${id}`);
        res.status(404).json({ error: 'User not found' });
        return;
    }

    // Check if app is already pinned
    const isAlreadyPinned = user.pinned_applications.some(app => app._id.toString() === appId);

    if (isAlreadyPinned) {

        res.status(200).json({
            message: 'Application is already pinned',
            pinned_applications: user.pinned_applications
        });
        return;
    }

    // Add the application to pinned applications using $push
    const updatedUser = await User.findByIdAndUpdate(
        id,
        { $push: { pinned_applications: appId } },
        { new: true, select: 'pinned_applications' }
    ).populate('pinned_applications', 'name description'); // Populate with app details

    if (!updatedUser) {
        res.status(500).json({ message: 'Failed to update user' });
        return;
    }

    res.status(200).json({
        message: 'Application pinned successfully',
        pinned_applications: updatedUser.pinned_applications
    });
};

export const removePinnedApps = async (req: Request, res: Response): Promise<void> => {
    const { id, appId } = req.params;

    if (!id || !appId) {
        logger.warn("Unauthorized: User ID and Application ID are required to remove pinned apps");
        res.status(401).json({ error: "User ID and Application ID are required" });
        return;
    }

    const user = await User.findById(id).lean();

    if (!user) {
        logger.warn(`User not found: ${id}`);
        res.status(404).json({ error: 'User not found' });
        return;
    }

    const isPinned = user.pinned_applications.some(app => app._id.toString() === appId);

    if (!isPinned) {
        res.status(200).json({
            message: 'Application is not pinned',
            pinned_applications: user.pinned_applications
        });
        return;
    }

    // Remove using $pull
    const updatedUser = await User.findByIdAndUpdate(
        id,
        { $pull: { pinned_applications: appId } },
        { new: true, select: 'pinned_applications' }
    );

    if (!updatedUser) {
        logger.error(`Failed to update user: ${id}`);
        res.status(500).json({ error: 'Failed to update user' });
        return;
    }

    res.status(200).json({
        message: 'Application unpinned successfully',
        pinned_applications: updatedUser.pinned_applications
    });
};