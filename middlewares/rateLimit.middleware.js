// -------------------------------------------------------------
//  OTP Rate Limit Middleware
//  - Limits OTP requests per phone number
//  - Uses Redis atomic counters
//  - Throws AppError for unified error handling
// -------------------------------------------------------------

import redis from "../config/redis.js";
import AppError from "../utils/AppError.js";

export const otpRateLimit = async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    throw new AppError("شماره موبایل ارسال نشده است", 400, "PHONE_REQUIRED");
  }

  const key = `otp-req:${phone}`;

  // Increment request count
  const count = await redis.incr(key);

  // First request → set TTL
  if (count === 1) {
    await redis.expire(key, 60); // 60 seconds window
  }

  // More than 3 requests in 60 seconds → block
  if (count > 3) {
    throw new AppError(
      "تعداد درخواست بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.",
      429,
      "OTP_RATE_LIMIT",
    );
  }

  next();
};
