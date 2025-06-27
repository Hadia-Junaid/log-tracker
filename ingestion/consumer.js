import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import LogModel from './models/Log.js'; 
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });


const worker = new Worker(
  'log_bull',
  async (job) => {
    const logs = job.data.logs;

    if (!Array.isArray(logs)) {
      console.warn('Malformed job:', job.data);
      return;
    }

    const parsed = [];

    for (const raw of logs) {
      try {
        const { log, application_id } = raw;
        const parsedLog = parseLogLine(log);
        parsed.push({
          ...parsedLog,
          application_id
        });
      } catch (err) {
        console.error('Failed to parse log:', raw, err.message);
      }
    }

    if (parsed.length > 0) {
      await LogModel.insertMany(parsed);
      console.log(`Inserted ${parsed.length} logs`);
    }
  },
  {
    connection: {
      host: '192.168.26.165',
      port: 6379,
      password: process.env.REDIS_PASSWORD || 'project'
    }
  }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} processed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err}`);
});

function parseLogLine(line) {
  const regex = /^\[(.+?)\] \[(.+?)\] \[(.+?)\](.*)$/;
  const match = line.match(regex);

  if (!match) throw new Error("Malformed log line: " + line);

  const [, dateStr, level, traceId, message] = match;

  return {
    timestamp: new Date(dateStr),
    log_level: level,
    trace_id: traceId,
    message: message.trim(),
  };
}
