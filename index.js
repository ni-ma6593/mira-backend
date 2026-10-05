import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import redis from "./config/redis.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import homeRoutes from "./routes/home.routes.js";
import productIntelligenceRoutes from "./routes/product-intelligence.routes.js";

import AppError from "./utils/AppError.js";
import errorHandler from "./middlewares/error.middleware.js";
import logger from "./utils/logger.js";

// -------------------------------------------------------------
//  Environment configuration
//  - Loads .env.development or .env.production based on NODE_ENV
//  - Falls back to a plain .env for any variable not present in
//    the mode-specific file, so existing local setups keep working
// -------------------------------------------------------------
const NODE_ENV = process.env.NODE_ENV || "development";
const envFile = NODE_ENV === "production" ? ".env.production" : ".env.development";

dotenv.config({ path: envFile });
dotenv.config(); // fallback / backward compatibility with plain .env

const isProduction = NODE_ENV === "production";

// Connect to MongoDB (Docker-safe)
connectDB();

const app = express();

app.set("trust proxy", isProduction ? 1 : 0);

app.use(helmet());

// -------------------------------------------------------------
//  CORS — environment based. In production only FRONTEND_URL
//  (comma-separated list allowed) may access the API; "*" is
//  never used in production.
// -------------------------------------------------------------
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server, mobile app) with no Origin header
      if (!origin) return callback(null, true);
      if (!isProduction) return callback(null, true); // permissive in dev
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError("دسترسی از این Origin مجاز نیست", 403, "CORS_NOT_ALLOWED"));
    },
    credentials: true,
  }),
);

app.use(morgan(isProduction ? "combined" : "dev"));
app.use(bodyParser.json({ limit: "1mb" }));

// -------------------------------------------------------------
//  Global rate limiter — coarse protection against abuse across
//  the whole API. Endpoint-specific limiters (e.g. OTP) still
//  apply on top of this.
// -------------------------------------------------------------
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "تعداد درخواست‌ها بیش از حد مجاز است",
      code: "RATE_LIMIT_EXCEEDED",
    },
  }),
);

// -------------------------------------------------------------
//  Health check — reports live status of Mongo + Redis so
//  deployment/monitoring tooling can verify the service is
//  actually usable, not just that the HTTP port is open.
// -------------------------------------------------------------
app.get("/health", (req, res) => {
  const mongoState = mongoose.connection.readyState; // 1 = connected
  const mongoStatus = mongoState === 1 ? "connected" : "disconnected";
  const redisStatus = redis.isReady ? "connected" : "disconnected";
  const healthy = mongoStatus === "connected" && redisStatus === "connected";

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? "ok" : "degraded",
    services: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/home", homeRoutes);
app.use("/api/v1/intelligence", productIntelligenceRoutes);

// -------------------------------------------------------------
//  API Docs (Swagger) — development/staging only.
//  Kept out of production to avoid exposing internal API
//  structure publicly. Set ENABLE_SWAGGER=true to force it on
//  in any environment if you ever need to.
// -------------------------------------------------------------
if (!isProduction || process.env.ENABLE_SWAGGER === "true") {
  const { default: swaggerUi } = await import("swagger-ui-express");
  const { default: swaggerSpec } = await import("./config/swagger.js");

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`📘 Swagger docs available at /api-docs`);
}

app.get("/", (req, res) => {
  res.json({ message: "سرور فعال است", env: NODE_ENV });
});

app.use((req, res, next) => {
  next(new AppError("مسیر مورد نظر یافت نشد", 404, "ROUTE_NOT_FOUND"));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT} [${NODE_ENV}]`);
});

// -------------------------------------------------------------
//  Graceful shutdown — stop accepting new connections, then
//  close Mongo/Redis cleanly before exiting. Prevents dropped
//  in-flight requests and Redis/Mongo error spam on restart.
// -------------------------------------------------------------
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);

  server.close(async () => {
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
    } catch (err) {
      logger.error("Error closing MongoDB connection", { error: err.message });
    }

    try {
      if (redis.isOpen) {
        await redis.quit();
        logger.info("Redis connection closed");
      }
    } catch (err) {
      logger.error("Error closing Redis connection", { error: err.message });
    }

    process.exit(0);
  });

  // Force-exit if shutdown hangs
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
