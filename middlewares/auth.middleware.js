// -------------------------------------------------------------
//  Authentication Middleware (Protected Routes)
//  - Validates JWT Access Token
//  - Loads the full user from the database and attaches it to
//    req.user (previously only { userId } was attached, which
//    broke every controller reading req.user.id / req.user._id)
//  - `req.user.userId` is still set for backward compatibility
//    with code that reads it directly (e.g. logoutController).
//  - Throws AppError for unified error handling
// -------------------------------------------------------------

import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import User from "../models/user.model.js";

// -------------------------------------------------------------
//  Shared core: verify a Bearer access token and load the user.
//  Used by authMiddleware (this file), authRequired.js, and
//  authOptional.js so all three stay in sync — previously each
//  had its own copy of this logic (one used .lean(), one didn't),
//  which is exactly the kind of drift that reintroduces bugs like
//  the earlier req.user.id breakage.
//  Throws AppError on any invalid/missing token; callers decide
//  whether to propagate that (required) or swallow it (optional).
// -------------------------------------------------------------
export const verifyAndLoadUser = async (authHeader) => {
  if (!authHeader) {
    throw new AppError("توکن ارسال نشده است", 401, "AUTH_HEADER_MISSING");
  }
  if (!authHeader.startsWith("Bearer ")) {
    throw new AppError("فرمت توکن معتبر نیست", 401, "INVALID_AUTH_FORMAT");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new AppError("توکن یافت نشد", 401, "TOKEN_MISSING");
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError("توکن نامعتبر یا منقضی شده است", 401, "INVALID_OR_EXPIRED_TOKEN");
  }

  if (!payload?.userId) {
    throw new AppError("ساختار توکن معتبر نیست", 401, "INVALID_TOKEN_PAYLOAD");
  }

  const user = await User.findById(payload.userId).select("-__v");
  if (!user) {
    throw new AppError("کاربر یافت نشد", 404, "USER_NOT_FOUND");
  }

  // Backward compatibility for code that reads req.user.userId directly
  user.userId = String(user._id);
  return user;
};

export const authMiddleware = async (req, res, next) => {
  const user = await verifyAndLoadUser(req.headers.authorization);
  // Attach full user document (req.user._id / req.user.id both work)
  req.user = user;
  next();
};
