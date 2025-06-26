import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)
});

const queue = new Queue('log_bull', { connection: redis });

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
