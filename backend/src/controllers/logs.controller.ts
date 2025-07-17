import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file
import { Request, Response } from "express";
import mongoose from "mongoose";
import Log from "../models/Log";
import UserGroup from "../models/UserGroup";
import Application from "../models/Application";
import User from "../models/User";
import logger from "../utils/logger";
import datatRetention from "../models/dataRetention";
// @ts-ignore
import { Parser as Json2csvParser } from "json2csv";
// GET /api/logs/:userId
import nodemailer from "nodemailer";
import config from "config";

import fs from "fs";
import path from "path";
// GET /api/logs/:userId
export const getLogs = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user.id;
  const {
    page = 1,
    app_ids = "",
    log_levels = "",
    start_time,
    end_time,
    search = "",
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  // Get user and their logsPerPage setting
  const user = await User.findById(userId).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const limitNum = user.settings?.logsPerPage || 10;
  // 1. Find user groups for the user
  let userGroups = await UserGroup.find({ members: userId }).lean();
  // Only keep active groups
  userGroups = userGroups.filter((g) => g.is_active === true);
  if (!userGroups.length) {
    res
      .status(404)
      .json({ error: "User is not a member of any active group" });
    return;
  }
  // 2. Collect all assigned application IDs from these groups
  const groupAppIds = userGroups.flatMap((g) =>
    g.assigned_applications.map((id) => id.toString())
  );
  
  // If app_ids is provided, filter further
  let filteredAppIds = groupAppIds;
  if (app_ids) {
    const requestedAppIds = (app_ids as string).split(",").filter(Boolean);
    filteredAppIds = groupAppIds.filter((id) => requestedAppIds.includes(id));
  }
  if (!filteredAppIds.length) {
    res.status(200).json({
      data: [],
      total: 0,
      total_logs: 0,
      total_pages: 0,
      assigned_applications: [],
    });
    return;
  }

  // 3. Get assigned applications' ids and names
  const assignedApplications = await Application.find({
    _id: { $in: groupAppIds },
  })
    .select("_id name")
    .lean();

  // 4. Build log query
  const logQuery: any = {
    application_id: {
      $in: filteredAppIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
  };
  if (log_levels) {
    logQuery.log_level = {
      $in: (log_levels as string).split(",").map((l) => l.trim()),
    };
  }
  if (start_time || end_time) {
    logQuery.timestamp = {};
    if (start_time) logQuery.timestamp.$gte = new Date(start_time as string);
    if (end_time) logQuery.timestamp.$lte = new Date(end_time as string);
  }
  if (search) {
    const safeSearch = escapeRegex(search as string);
    logQuery.message = { $regex: safeSearch, $options: "i" };
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
    Log.countDocuments(logQuery),
  ]);

  const total_pages = Math.ceil(total_logs / limitNum);
  res.status(200).json({
    data: logs,
    total: logs.length,
    total_logs,
    total_pages,
    assigned_applications: assignedApplications,
  });
};

export const exportLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user.id;
  const {
    app_ids = "",
    log_levels = "",
    start_time,
    end_time,
    search = "",
    is_csv = false,
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  // Get user
  const user = await User.findById(userId).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // 1. Find user groups for the user
  let userGroups = await UserGroup.find({ members: userId }).lean();
  // Only keep active groups
  userGroups = userGroups.filter((g) => g.is_active === true);
  if (!userGroups.length) {
    res
      .status(404)
      .json({ error: "User is not a member of any active group" });
    return;
  }
  // 2. Collect all assigned application IDs from these groups
  const groupAppIds = userGroups.flatMap((g) =>
    g.assigned_applications.map((id) => id.toString())
  );
  // If app_ids is provided, filter further
  let filteredAppIds = groupAppIds;
  if (app_ids) {
    const requestedAppIds = (app_ids as string).split(",").filter(Boolean);
    filteredAppIds = groupAppIds.filter((id) => requestedAppIds.includes(id));
  }
  if (!filteredAppIds.length) {
    res.status(200).json({ data: [], total: 0 });
    return;
  }

  // 3. Build log query
  const logQuery: any = {
    application_id: {
      $in: filteredAppIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
  };
  if (log_levels) {
    logQuery.log_level = {
      $in: (log_levels as string).split(",").map((l) => l.trim()),
    };
  }
  if (start_time || end_time) {
    logQuery.timestamp = {};
    if (start_time) logQuery.timestamp.$gte = new Date(start_time as string);
    if (end_time) logQuery.timestamp.$lte = new Date(end_time as string);
  }
  if (search) {
    const safeSearch = escapeRegex(search as string);
    logQuery.message = { $regex: safeSearch, $options: "i" };
  }

  // 4. Count logs first
  const logCount = await Log.countDocuments(logQuery);
  if (logCount > 10000) {
    // Trigger async email send (placeholder)
    await sendLogsByEmail(user, logQuery, is_csv === "true");
    res.status(200).json({ emailSent: true });
    return;
  }

  // 5. Query all logs (no pagination)
  const logs = await Log.find(logQuery).sort({ timestamp: -1 }).lean();

  // 6. Return as CSV or JSON
  if (is_csv === "true") {
    // Convert logs to CSV
    const fields = [
      "_id",
      "application_id",
      "timestamp",
      "log_level",
      "trace_id",
      "message",
    ];
    const opts = { fields };
    const parser = new Json2csvParser(opts);
    const csv = parser.parse(logs);
    res.header("Content-Type", "text/csv");
    res.attachment("logs.csv");
    res.send(csv);
  } else {
    const allowedFields = [
      "_id",
      "application_id",
      "timestamp",
      "log_level",
      "trace_id",
      "message",
    ];
    const filteredLogs = logs.map((log) => {
      const filtered: any = {};
      const logObj = log as Record<string, any>;
      allowedFields.forEach((field) => {
        if (logObj[field] !== undefined) filtered[field] = logObj[field];
      });
      return filtered;
    });
    res.status(200).json({ data: filteredLogs, total: filteredLogs.length });
  }
};

// Placeholder for async email sending
async function sendLogsByEmail(user: any, logQuery: any, isCsv: boolean) {
  // Query all logs
  const logs = await Log.find(logQuery).sort({ timestamp: -1 }).lean();
  let fileBuffer: Buffer;
  let filename: string;
  let mimetype: string;
  if (isCsv) {
    const fields = [
      "_id",
      "application_id",
      "timestamp",
      "log_level",
      "trace_id",
      "message",
    ];
    const opts = { fields };
    const parser = new Json2csvParser(opts);
    const csv = parser.parse(logs);
    fileBuffer = Buffer.from(csv, "utf-8");
    filename = "logs.csv";
    mimetype = "text/csv";
  } else {
    const allowedFields = [
      "_id",
      "application_id",
      "timestamp",
      "log_level",
      "trace_id",
      "message",
    ];
    const filteredLogs = logs.map((log) => {
      const filtered: any = {};
      const logObj = log as Record<string, any>;
      allowedFields.forEach((field) => {
        if (logObj[field] !== undefined) filtered[field] = logObj[field];
      });
      return filtered;
    });
    fileBuffer = Buffer.from(JSON.stringify(filteredLogs, null, 2), "utf-8");
    filename = "logs.json";
    mimetype = "application/json";
  }
  // Setup nodemailer transport
  const transporter = nodemailer.createTransport({
      host: config.get<string>('email.smtpHost'),
      port: config.get<number>('email.smtpPort'),
      secure: false, // true for port 465, false for others like 587
      auth: {
        user: config.get<string>('email.smtpUser'),
        pass: config.get<string>('email.smtpPass'),
      },
    });
  // Send email
  await transporter.sendMail({
    from: config.get<string>('email.from'),
    to: user.email,
    subject: "Your log export is ready",
    text: "Attached is your requested log export.",
    attachments: [
      {
        filename,
        content: fileBuffer,
        contentType: mimetype,
      },
    ],
  });
  logger.info(`Sent logs export to ${user.email}`);
}

export const userdata = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  // Get user
  const user = await User.findById(userId).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  // 1. Find user groups for the user (active only)
  let userGroups = await UserGroup.find({ members: userId }).lean();
  userGroups = userGroups.filter((g) => g.is_active === true);
  if (!userGroups.length) {
    res
      .status(404)
      .json({ error: "User is not a member of any active group" });
    return;
  }
  // 2. Collect all assigned application IDs from these groups
  const groupAppIds = userGroups.flatMap((g) =>
    g.assigned_applications.map((id) => id.toString())
  );
  // 3. Get assigned applications' ids and names
  const assignedApplications = await Application.find({
    _id: { $in: groupAppIds },
  })
    .select("_id name")
    .lean();
  // 4. Get user settings
  const { autoRefresh, autoRefreshTime } = user.settings || {};
  // 5. Get TTL index value from Log collection
  const mdataRetention = await datatRetention.findOne().lean();
  const logTTL = mdataRetention ? mdataRetention.retentionDays * 86400 : null;
  res.status(200).json({
    assigned_applications: assignedApplications,
    autoRefresh,
    autoRefreshTime,
    logTTL,
  });
};

// Helper to escape regex special characters
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/logs/activity - Get aggregated log activity data for charts
export const getLogActivityData = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user.id;
  const {
    app_ids = "",
    log_levels = "",
    start_time,
    end_time,
    group_by = "hour", // hour, day, etc.
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  // Get user
  const user = await User.findById(userId).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // 1. Find user groups for the user
  let userGroups = await UserGroup.find({ members: userId }).lean();
  // Only keep active groups
  userGroups = userGroups.filter((g) => g.is_active === true);
  if (!userGroups.length) {
    res
      .status(404)
      .json({ error: "User is not a member of any active group" });
    return;
  }

  const groupAppIds = userGroups.flatMap((g) =>
    g.assigned_applications.map((id) => id.toString())
  );

  let filteredAppIds = groupAppIds;
  if (app_ids) {
    const requestedAppIds = (app_ids as string).split(",").filter(Boolean);
    filteredAppIds = groupAppIds.filter((id) => requestedAppIds.includes(id));
  }

  if (!filteredAppIds.length) {
    res.status(200).json({
      data: [],
      groups: [],
      series: [],
      applications: [],
    });
    return;
  }

  const assignedApplications = await Application.find({
    _id: { $in: groupAppIds },
    isActive: true,
  })
    .select("_id name isActive")
    .lean();

  // 4. Build log query
  const logQuery: any = {
    application_id: {
      $in: filteredAppIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
  };

  if (log_levels) {
    logQuery.log_level = {
      $in: (log_levels as string).split(",").map((l) => l.trim()),
    };
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
          hour: {
            $dateTrunc: {
              date: "$timestamp",
              unit: "hour",
            },
          },
          log_level: "$log_level",
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        groupId: {
          $dateToString: {
            format: "%Y-%m-%dT%H:00:00Z", // Matches generated UTC hours
            date: "$_id.hour",
            timezone: "UTC",
          },
        },
        seriesId: "$_id.log_level",
        value: "$count",
      },
    },
    { $sort: { groupId: 1, seriesId: 1 } },
  ];

    const aggregatedData = await Log.aggregate(aggregationPipeline);

    const knownLogLevels = ["DEBUG", "INFO", "WARN", "ERROR"]; // fallback if no data

  // Generate hourly UTC group labels
  function generateHourlyGroups(start: Date, end: Date): string[] {
    const groups: string[] = [];
    const current = new Date(start.getTime());
    current.setUTCMinutes(0, 0, 0); // Truncate to UTC top of hour

    while (current <= end) {
      const isoHour = current.toISOString().slice(0, 13); // '2025-07-14T11'
      const groupStr = isoHour + ":00:00Z"; // Matches Mongo output
      groups.push(groupStr);
      current.setUTCHours(current.getUTCHours() + 1);
    }

    return groups;
  }

  const startDate = new Date(start_time as string);
  const endDate = new Date(end_time as string);
  const allHours = generateHourlyGroups(startDate, endDate);

  // Use known levels if aggregation returned none (no log activity)
  const logLevels =
    aggregatedData.length > 0
      ? [...new Set(aggregatedData.map((item) => item.seriesId))].sort()
      : knownLogLevels;

  // Normalize chart data
  const chartData: any[] = [];
  allHours.forEach((hour) => {
    logLevels.forEach((level) => {
      const existingItem = aggregatedData.find(
        (item) => item.groupId === hour && item.seriesId === level
      );
      chartData.push({
        groupId: hour,
        seriesId: level,
        value: existingItem ? existingItem.value : 0,
      });
    });
  });

  res.status(200).json({
    data: chartData,
    groups: allHours,
    series: logLevels,
    applications: assignedApplications,
  });
};