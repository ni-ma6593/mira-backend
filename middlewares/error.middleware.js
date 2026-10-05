// -------------------------------------------------------------
//  Global Error Handler
//  - Logs errors using Winston
//  - Returns clean Persian messages to client
// -------------------------------------------------------------

import logger from "../utils/logger.js";

export default function errorHandler(err, req, res, next) {
  logger.error({
    message: err.message,
    code: err.errorCode,
    status: err.statusCode,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  const status = err.statusCode || 500;

  res.status(status).json({
    success: false,
    errorCode: err.errorCode || "SERVER_ERROR",
    message: err.message || "خطای غیرمنتظره‌ای رخ داده است",
  });
}
