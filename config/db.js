import mongoose from "mongoose";
import logger from "../utils/logger.js";

// -------------------------------------------------------------
//  MongoDB Connection
//  - Hostname/port come ONLY from MONGO_URI (never hard-coded):
//      Docker : mongodb://mongo:27017/mira
//      Local  : mongodb://127.0.0.1:27017/mira
//  - Retries with a fixed backoff instead of crashing on startup
//  - Connection-state events are logged so drops are visible
// -------------------------------------------------------------

mongoose.connection.on("connected", () => logger.info("✅ MongoDB connected successfully"));
mongoose.connection.on("disconnected", () => logger.warn("MongoDB: disconnected"));
mongoose.connection.on("reconnected", () => logger.info("MongoDB: reconnected"));
mongoose.connection.on("error", (err) => logger.error("MongoDB connection error", { error: err.message }));

const connectDB = async (retryDelayMs = 3000) => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://mongo:27017/mira",
      {
        serverSelectionTimeoutMS: 5000,
      },
    );
  } catch (error) {
    logger.error("❌ MongoDB initial connection failed, retrying", {
      error: error.message,
      retryInMs: retryDelayMs,
    });
    setTimeout(() => connectDB(retryDelayMs), retryDelayMs);
  }
};

export default connectDB;
