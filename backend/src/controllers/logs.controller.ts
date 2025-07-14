import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Log from '../models/Log';
import UserGroup from '../models/UserGroup';
import Application from '../models/Application';
import User from '../models/User';
import logger from '../utils/logger';
// @ts-ignore
import { Parser as Json2csvParser } from 'json2csv';
// GET /api/logs/:userId
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
// GET /api/logs/:userId
export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      app_ids = '',
      log_levels = '',
      start_time,
      end_time,
      search = ''
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid userId' });
      return;
    }
    // Get user and their logsPerPage setting
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const limitNum = user.settings?.logsPerPage || 10;
    // 1. Find user groups for the user
    let userGroups = await UserGroup.find({ members: userId }).lean();
    // Only keep active groups
    userGroups = userGroups.filter(g => g.is_active === true);
    if (!userGroups.length) {
      res.status(404).json({ error: 'User is not a member of any active group' });
      return;
    }
    // 2. Collect all assigned application IDs from these groups
    const groupAppIds = userGroups.flatMap(g => g.assigned_applications.map(id => id.toString()));
    // If app_ids is provided, filter further
    let filteredAppIds = groupAppIds;
    if (app_ids) {
      const requestedAppIds = (app_ids as string).split(',').filter(Boolean);
      filteredAppIds = groupAppIds.filter(id => requestedAppIds.includes(id));
    }
    if (!filteredAppIds.length) {
      res.status(200).json({ data: [], total: 0, total_logs: 0, total_pages: 0, assigned_applications: [] });
      return;
    }

    // 3. Get assigned applications' ids and names
    const assignedApplications = await Application.find({ _id: { $in: groupAppIds } })
      .select('_id name')
      .lean();

    // 4. Build log query
    const logQuery: any = {
      application_id: { $in: filteredAppIds.map(id => new mongoose.Types.ObjectId(id)) }
    };
    if (log_levels) {
      logQuery.log_level = { $in: (log_levels as string).split(',').map(l => l.trim()) };
    }
    if (start_time || end_time) {
      logQuery.timestamp = {};
      if (start_time) logQuery.timestamp.$gte = new Date(start_time as string);
      if (end_time) logQuery.timestamp.$lte = new Date(end_time as string);
    }
    if (search) {
      const safeSearch = escapeRegex(search as string);
      logQuery.message = { $regex: safeSearch, $options: 'i' };
    }

    // 5. Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const skip = (pageNum - 1) * limitNum;

    // 6. Query logs
    const [logs, total_logs] = await Promise.all([
      Log.find(logQuery)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Log.countDocuments(logQuery)
    ]);

    const total_pages = Math.ceil(total_logs / limitNum);

    res.status(200).json({
      data: logs,
      total: logs.length,
      total_logs,
      total_pages,
      assigned_applications: assignedApplications
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs', details: err });
  }
};


export const exportLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const {
      app_ids = '',
      log_levels = '',
      start_time,
      end_time,
      search = '',
      is_csv = false
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid userId' });
      return;
    }

    // Get user
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 1. Find user groups for the user
    let userGroups = await UserGroup.find({ members: userId }).lean();
    // Only keep active groups
    userGroups = userGroups.filter(g => g.is_active === true);
    if (!userGroups.length) {
      res.status(404).json({ error: 'User is not a member of any active group' });
      return;
    }
    // 2. Collect all assigned application IDs from these groups
    const groupAppIds = userGroups.flatMap(g => g.assigned_applications.map(id => id.toString()));
    // If app_ids is provided, filter further
    let filteredAppIds = groupAppIds;
    if (app_ids) {
      const requestedAppIds = (app_ids as string).split(',').filter(Boolean);
      filteredAppIds = groupAppIds.filter(id => requestedAppIds.includes(id));
    }
    if (!filteredAppIds.length) {
      res.status(200).json({ data: [], total: 0 });
      return;
    }

    // 3. Build log query
    const logQuery: any = {
      application_id: { $in: filteredAppIds.map(id => new mongoose.Types.ObjectId(id)) }
    };
    if (log_levels) {
      logQuery.log_level = { $in: (log_levels as string).split(',').map(l => l.trim()) };
    }
    if (start_time || end_time) {
      logQuery.timestamp = {};
      if (start_time) logQuery.timestamp.$gte = new Date(start_time as string);
      if (end_time) logQuery.timestamp.$lte = new Date(end_time as string);
    }
    if (search) {
      const safeSearch = escapeRegex(search as string);
      logQuery.message = { $regex: safeSearch, $options: 'i' };
    }

    // 4. Count logs first
    const logCount = await Log.countDocuments(logQuery);
    if (logCount > 1000) {
      // Trigger async email send (placeholder)
      sendLogsByEmail(user, logQuery, is_csv === 'true');
      res.status(200).json({ emailSent: true });
      return;
    }

    // 5. Query all logs (no pagination)
    const logs = await Log.find(logQuery).sort({ timestamp: -1 }).lean();

    // 6. Return as CSV or JSON
    if (is_csv === 'true') {
      // Convert logs to CSV
      const fields = ['_id', 'application_id', 'timestamp', 'log_level', 'trace_id', 'message'];
      const opts = { fields };
      try {
        const parser = new Json2csvParser(opts);
        const csv = parser.parse(logs);
        res.header('Content-Type', 'text/csv');
        res.attachment('logs.csv');
        res.send(csv);
      } catch (err) {
        res.status(500).json({ error: 'Failed to export logs as CSV', details: err });
      }
    } else {
      const allowedFields = ['_id', 'application_id', 'timestamp', 'log_level', 'trace_id', 'message'];
      const filteredLogs = logs.map(log => {
        const filtered: any = {};
        const logObj = log as Record<string, any>;
        allowedFields.forEach(field => { if (logObj[field] !== undefined) filtered[field] = logObj[field]; });
        return filtered;
      });
      res.status(200).json({ data: filteredLogs, total: filteredLogs.length });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to export logs', details: err });
  }
};

// Placeholder for async email sending
async function sendLogsByEmail(user: any, logQuery: any, isCsv: boolean) {
  try {
    // Query all logs
    const logs = await Log.find(logQuery).sort({ timestamp: -1 }).lean();
    let fileBuffer: Buffer;
    let filename: string;
    let mimetype: string;
    if (isCsv) {
      const fields = ['_id', 'application_id', 'timestamp', 'log_level', 'trace_id', 'message'];
      const opts = { fields };
      const parser = new Json2csvParser(opts);
      const csv = parser.parse(logs);
      fileBuffer = Buffer.from(csv, 'utf-8');
      filename = 'logs.csv';
      mimetype = 'text/csv';
    } else {
      const allowedFields = ['_id', 'application_id', 'timestamp', 'log_level', 'trace_id', 'message'];
      const filteredLogs = logs.map(log => {
        const filtered: any = {};
        const logObj = log as Record<string, any>;
        allowedFields.forEach(field => { if (logObj[field] !== undefined) filtered[field] = logObj[field]; });
        return filtered;
      });
      fileBuffer = Buffer.from(JSON.stringify(filteredLogs, null, 2), 'utf-8');
      filename = 'logs.json';
      mimetype = 'application/json';
    }
    // Setup nodemailer transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Your log export is ready',
      text: 'Attached is your requested log export.',
      attachments: [
        {
          filename,
          content: fileBuffer,
          contentType: mimetype,
        },
      ],
    });
    logger.info(`Sent logs export to ${user.email}`);
  } catch (err) {
    logger.error(`Failed to send logs export to ${user?.email}: ${err}`);
  }
}

export const userdata = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid userId' });
      return;
    }
    // Get user
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    // 1. Find user groups for the user (active only)
    let userGroups = await UserGroup.find({ members: userId }).lean();
    userGroups = userGroups.filter(g => g.is_active === true);
    if (!userGroups.length) {
      res.status(404).json({ error: 'User is not a member of any active group' });
      return;
    }
    // 2. Collect all assigned application IDs from these groups
    const groupAppIds = userGroups.flatMap(g => g.assigned_applications.map(id => id.toString()));
    // 3. Get assigned applications' ids and names
    const assignedApplications = await Application.find({ _id: { $in: groupAppIds } })
      .select('_id name')
      .lean();
    // 4. Get user settings
    const { autoRefresh, autoRefreshTime } = user.settings || {};
    // 5. Get TTL index value from Log collection
    const indexes = await Log.collection.indexes();
    const ttlIndex = indexes.find(idx => idx.key && idx.key.timestamp === 1 && idx.expireAfterSeconds);
    const logTTL = ttlIndex ? ttlIndex.expireAfterSeconds : null;
    res.status(200).json({
      assigned_applications: assignedApplications,
      autoRefresh,
      autoRefreshTime,
      logTTL
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user data', details: err });
  }
};

// Helper to escape regex special characters
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 

// GET /api/logs/activity - Get aggregated log activity data for charts
export const getLogActivityData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const {
      app_ids = '',
      log_levels = '',
      start_time,
      end_time,
      group_by = 'hour' // hour, day, etc.
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid userId' });
      return;
    }

    // Get user
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 1. Find user groups for the user
    let userGroups = await UserGroup.find({ members: userId }).lean();
    // Only keep active groups
    userGroups = userGroups.filter(g => g.is_active === true);
    if (!userGroups.length) {
      res.status(404).json({ error: 'User is not a member of any active group' });
      return;
    }

    const groupAppIds = userGroups.flatMap(g => g.assigned_applications.map(id => id.toString()));
    
    let filteredAppIds = groupAppIds;
    if (app_ids) {
      const requestedAppIds = (app_ids as string).split(',').filter(Boolean);
      filteredAppIds = groupAppIds.filter(id => requestedAppIds.includes(id));
    }

    if (!filteredAppIds.length) {
      res.status(200).json({ 
        data: [], 
        groups: [], 
        series: [],
        applications: []
      });
      return;
    }

    const assignedApplications = await Application.find({ _id: { $in: groupAppIds } })
      .select('_id name isActive')
      .lean();

    // 4. Build log query
    const logQuery: any = {
      application_id: { $in: filteredAppIds.map(id => new mongoose.Types.ObjectId(id)) }
    };

    if (log_levels) {
      logQuery.log_level = { $in: (log_levels as string).split(',').map(l => l.trim()) };
    }

    if (start_time || end_time) {
      logQuery.timestamp = {};
      if (start_time) logQuery.timestamp.$gte = new Date(start_time as string);
      if (end_time) logQuery.timestamp.$lte = new Date(end_time as string);
    }

    const aggregationPipeline: any[] = [
      { $match: logQuery },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            log_level: '$log_level'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          groupId: { $concat: [{ $toString: '$_id.hour' }, ':00'] },
          seriesId: '$_id.log_level',
          value: '$count'
        }
      },
      { $sort: { groupId: 1, seriesId: 1 } }
    ];

    const aggregatedData = await Log.aggregate(aggregationPipeline);


    const allHours = Array.from({ length: 24 }, (_, i) => 
      i.toString().padStart(2, '0') + ':00'
    );


    const logLevels = [...new Set(aggregatedData.map(item => item.seriesId))].sort();


    const chartData: any[] = [];
    allHours.forEach(hour => {
      logLevels.forEach(level => {
        const existingItem = aggregatedData.find(
          item => item.groupId === hour && item.seriesId === level
        );
        chartData.push({
          groupId: hour,
          seriesId: level,
          value: existingItem ? existingItem.value : 0
        });
      });
    });

 
    res.status(200).json({
      data: chartData,
      groups: allHours,
      series: logLevels,
      applications: assignedApplications
    });

  } catch (err) {
    console.error('Failed to fetch log activity data:', err);
    res.status(500).json({ error: 'Failed to fetch log activity data', details: err });
  }
}; 