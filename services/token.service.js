import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

/**
 * Generate short-lived Access Token
 * - Used for authenticating API requests
 * - Contains only userId
 * - Lifetime is intentionally short (default: 15 minutes)
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
};

/**
 * Generate long-lived Refresh Token
 * - Used to obtain new Access Tokens
 * - Stored in Redis for session control
 * - Lifetime is long (default: 30 days)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "30d" }
  );
};

/**
 * Generate both Access + Refresh tokens
 * - Refresh Token is stored in Redis (session-based)
 * - Access Token is returned to client
 */
export const generateTokens = async (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  // Store refresh token in Redis with 30-day TTL
  await redis.set(
    `refresh:${userId}`,
    refreshToken,
    { EX: 60 * 60 * 24 * 30 }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify refresh token signature
 * - Returns payload if valid
 * - Returns null if invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
};

/**
 * Refresh Token Rotation
 * - Validates old refresh token
 * - Ensures it matches the one stored in Redis (prevents token reuse attacks)
 * - Generates new Access + Refresh tokens
 * - Stores new refresh token in Redis (replaces old one)
 */
export const rotateTokens = async (oldRefreshToken) => {
  // Step 1: Verify token signature
  const payload = verifyRefreshToken(oldRefreshToken);
  if (!payload) return null;

  const userId = payload.userId;

  // Step 2: Ensure token matches the one stored in Redis
  const storedToken = await redis.get(`refresh:${userId}`);
  if (!storedToken || storedToken !== oldRefreshToken) {
    // Token reuse or invalid token → reject
    return null;
  }

  // Step 3: Generate new tokens
  const accessToken = generateAccessToken(userId);
  const newRefreshToken = generateRefreshToken(userId);

  // Step 4: Replace old refresh token in Redis
  await redis.set(
    `refresh:${userId}`,
    newRefreshToken,
    { EX: 60 * 60 * 24 * 30 }
  );

  return { accessToken, refreshToken: newRefreshToken, userId };
};
