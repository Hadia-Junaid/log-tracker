import Log from "../models/Log";
import { parseLogLine } from "../utils/parseLogLine";
import { Job } from "bullmq";
import logger from "../utils/logger";


export const logWorker = async (job: Job) => {
  const logs = job.data.logs;

  if (!Array.isArray(logs)) {
    logger.warn("Malformed job:", job.data);
    return;
  }

  const parsed = [];

  for (const raw of logs) {
    try {
      const { log, application_id } = raw;
      const parsedLog = parseLogLine(log);
      parsed.push({
        ...parsedLog,
        application_id,
      });
    } catch (err: any) {
      logger.error("Failed to parse log:", raw, err.message);
    }
  }

  if (parsed.length > 0) {
    await Log.insertMany(parsed);
    logger.debug(`Inserted ${parsed.length} logs`);
  }
};
