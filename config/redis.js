import { createClient } from "redis";
import logger from "../utils/logger.js";

// -------------------------------------------------------------
//  Redis Client
//  - Hostname/port come ONLY from REDIS_URL (never hard-coded):
//      Docker : redis://redis:6379
//      Local  : redis://127.0.0.1:6379  (or redis://localhost:6379)
//    Set the correct value per environment in .env / docker-compose.
//  - reconnectStrategy retries with backoff instead of dying
//  - Connection errors are logged (never crash the process directly;
//    index.js graceful-shutdown handling decides if/when to exit)
// -------------------------------------------------------------

const redis = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        logger.error("Redis: max reconnect attempts exceeded, giving up");
        return new Error("Redis max reconnect attempts exceeded");
      }
      // backoff: 100ms, 200ms, ... capped at 5s
      return Math.min(retries * 100, 5000);
    },
    connectTimeout: 10000,
  },
});

redis.on("error", (err) => logger.error("Redis Error", { error: err.message }));
redis.on("connect", () => logger.info("Redis: connecting..."));
redis.on("ready", () => logger.info("✅ Redis connected successfully"));
redis.on("reconnecting", () => logger.warn("Redis: reconnecting..."));
redis.on("end", () => logger.warn("Redis: connection closed"));

try {
  await redis.connect();
} catch (err) {
  // Don't crash on startup if Redis is briefly unavailable — the
  // reconnectStrategy above will keep retrying in the background.
  logger.error("Redis: initial connection failed", { error: err.message });
}

export default redis;
