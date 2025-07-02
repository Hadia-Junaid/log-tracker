import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
<<<<<<< HEAD
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD // Ensure this is set in your environment
=======
  port: Number(process.env.REDIS_PORT)
>>>>>>> origin/feature/User-Management
});

const queue = new Queue('log_bull', { connection: redis });

<<<<<<< HEAD
const BATCH_SIZE = 100;
const MAX_WAIT_MS = 2000;
const POLL_INTERVAL_MS = 500;

let lastFlush = Date.now();

function shouldFlush(length) {
  return length >= BATCH_SIZE || (Date.now() - lastFlush) >= MAX_WAIT_MS;
}

async function flushLogsFromRedis() {
  const logs = await redis.lrange('logs', 0, BATCH_SIZE - 1);
  if (logs.length === 0) return;

  try {
    const parsedLogs = logs.map((raw) => JSON.parse(raw));

    await queue.add('log_batch', { logs: parsedLogs }, {
      removeOnComplete: true,
      removeOnFail: true
    });

    await redis.ltrim('logs', logs.length, -1);
    lastFlush = Date.now();

    console.log(`Flushed batch of ${parsedLogs.length} logs`);
  } catch (err) {
    console.error("Failed to parse or enqueue logs:", err);
  }
}

async function pollLoop() {
  console.log("Bridge started...");
  while (true) {
    try {
      let listLength = await redis.llen('logs');

      while (shouldFlush(listLength)) {
        await flushLogsFromRedis();
        listLength = await redis.llen('logs');
      }
    } catch (err) {
      console.error("Error during polling:", err);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

pollLoop();

async function gracefulShutdown() {
  console.log("Shutting down... flushing any remaining logs.");
  await flushLogsFromRedis();
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
=======
(async function start() {
  console.log("Bridge started...");
  while (true) {
    const res = await redis.blpop('logs', 0);
    const raw = res?.[1];
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      await queue.add('log', parsed);
    } catch (e) {
      console.error("Invalid JSON:", raw);
    }
  }
})();
>>>>>>> origin/feature/User-Management
