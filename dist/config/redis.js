"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
// Create an ioredis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'; // Use Redis URL from environment
exports.redisClient = new ioredis_1.default(redisUrl);
exports.redisClient.on('connect', () => {
    logger_1.default.info("Connected to Redis successfully");
});
exports.redisClient.on('error', (err) => {
    logger_1.default.error('Redis Client Error:', err);
});
