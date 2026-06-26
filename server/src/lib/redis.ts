import { Redis } from "ioredis";
import { env } from "./env";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  console.log("Redis connected successfully");
});

redisConnection.on("error", (err) => {
  console.error("Redis connection error:", err);
});