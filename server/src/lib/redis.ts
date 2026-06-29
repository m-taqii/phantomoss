import { Redis } from "ioredis";
import { env } from "./env";

const redisOpts = {
  maxRetriesPerRequest: null,
  family: 4,
  keepAlive: 10000,
  retryStrategy(times: number) {
    return Math.min(times * 200, 5000);
  },
};

export const redisConnection = new Redis(env.REDIS_URL, redisOpts);

export function createRedisConnection() {
  return new Redis(env.REDIS_URL, redisOpts);
}

redisConnection.on("connect", () => {
  console.log("Redis connected successfully");
});

redisConnection.on("error", (err) => {
  if ((err as any).code !== "ECONNRESET" && (err as any).code !== "ECONNABORTED") {
    console.error("Redis connection error:", err.message);
  }
});