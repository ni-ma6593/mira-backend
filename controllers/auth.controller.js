// -------------------------------------------------------------
//  Auth Controller (Production-Ready)
// -------------------------------------------------------------

import redis from "../config/redis.js";
import User from "../models/user.model.js";
import smsService from "../services/sms.service.js";
import { generateTokens, rotateTokens } from "../services/token.service.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

const OTP_TTL_SECONDS = 120;
const MAX_VERIFY_ATTEMPTS = 5;

// -------------------------------------------------------------
//  Send OTP
// -------------------------------------------------------------
export const sendOtpController = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new AppError("شماره موبایل ارسال نشده است", 400, "PHONE_REQUIRED");
    }

    // Generate OTP
    const code = crypto.randomInt(100000, 999999).toString();
    // NOTE: never log the OTP code itself, even in development —
    // only that one was issued, so incidents remain traceable.
    logger.info("OTP issued", { phone });

    // Save OTP in Redis (2 minutes) and reset any previous verify-attempt counter
    await redis.set(`otp:${phone.toString()}`, code, { EX: OTP_TTL_SECONDS });
    await redis.del(`otp-attempts:${phone.toString()}`);

    // Send SMS
    await smsService.sendOTP(phone.toString(), code);

    res.json({
      success: true,
      message: "کد تایید ارسال شد",
    });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------------
//  Verify OTP
// -------------------------------------------------------------
export const verifyOtpController = async (req, res, next) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      throw new AppError(
        "شماره موبایل یا کد تایید ارسال نشده است",
        400,
        "OTP_DATA_MISSING",
      );
    }

    // Brute-force protection: cap wrong-code attempts per phone while
    // the OTP is still valid. TTL mirrors the OTP's own expiry so the
    // attempt counter never outlives the code it's guarding.
    const attemptsKey = `otp-attempts:${phone}`;
    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) {
      await redis.expire(attemptsKey, OTP_TTL_SECONDS);
    }
    if (attempts > MAX_VERIFY_ATTEMPTS) {
      throw new AppError(
        "تعداد تلاش‌های مجاز برای این کد به پایان رسیده است. کد جدید درخواست کنید.",
        429,
        "OTP_TOO_MANY_ATTEMPTS",
      );
    }

    const savedCode = await redis.get(`otp:${phone}`);

    if (!savedCode || savedCode !== code) {
      throw new AppError(
        "کد تایید اشتباه یا منقضی شده است",
        400,
        "OTP_INVALID",
      );
    }

    // Correct code — clear the attempt counter
    await redis.del(attemptsKey);

    // Find or create user
    let user = await User.findOne({ phone });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({ phone });
    }

    // Generate tokens
    const tokens = await generateTokens(user._id);

    // Remove OTP
    await redis.del(`otp:${phone}`);

    // Send welcome message (non-blocking)
    if (isNewUser) {
      smsService.sendWelcomeMessage(phone).catch(() => {});
    }

    res.json({
      success: true,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------------
//  Refresh Token Rotation
// -------------------------------------------------------------
export const refreshTokenController = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(
        "رفرش توکن ارسال نشده است",
        400,
        "REFRESH_TOKEN_REQUIRED",
      );
    }

    const rotated = await rotateTokens(refreshToken);

    if (!rotated) {
      throw new AppError(
        "رفرش توکن نامعتبر یا منقضی شده است",
        401,
        "REFRESH_TOKEN_INVALID",
      );
    }

    const user = await User.findById(rotated.userId);

    if (!user) {
      throw new AppError("کاربر یافت نشد", 404, "USER_NOT_FOUND");
    }

    res.json({
      success: true,
      user,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------------
//  Logout
// -------------------------------------------------------------
export const logoutController = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("احراز هویت انجام نشده است", 401, "UNAUTHORIZED");
    }

    await redis.del(`refresh:${userId}`);

    res.json({
      success: true,
      message: "با موفقیت خارج شدید",
    });
  } catch (err) {
    next(err);
  }
};
