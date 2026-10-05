import express from "express";
import {
  sendOtpController,
  verifyOtpController,
  refreshTokenController,
  logoutController,
} from "../controllers/auth.controller.js";

import { otpRateLimit } from "../middlewares/rateLimit.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Public Authentication Routes
 * ----------------------------------------------------
 * These routes are accessible without authentication.
 * Used for login, registration, and token refreshing.
 */

/**
 * @desc Send OTP to user's phone number (rate‑limited)
 * @route POST /api/v1/auth/send-otp
 * @access Public
 */
router.post("/send-otp", otpRateLimit, sendOtpController);

/**
 * @desc Verify OTP → Login or Register user
 * @route POST /api/v1/auth/verify-otp
 * @access Public
 */
router.post("/verify-otp", verifyOtpController);

/**
 * @desc Refresh Token Rotation (issue new access + refresh tokens)
 * @route POST /api/v1/auth/refresh-token
 * @access Public
 */
router.post("/refresh-token", refreshTokenController);


/**
 * Protected Authentication Routes
 * ----------------------------------------------------
 * These routes require a valid Access Token.
 * authMiddleware ensures the user is authenticated.
 */

/**
 * @desc Logout user by invalidating their refresh token
 * @route POST /api/v1/auth/logout
 * @access Private
 */
router.post("/logout", authMiddleware, logoutController);

export default router;
