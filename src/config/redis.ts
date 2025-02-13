import Redis from "ioredis";
import logger from "../utils/logger";

// Create an ioredis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';  // Use Redis URL from environment
export const redisClient = new Redis(redisUrl);

redisClient.on('connect', () => {
  logger.info("Connected to Redis successfully");
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});
