// -------------------------------------------------------------
//  Custom Application Error Class
//  - Used to create consistent, structured errors across the app
//  - Supports: message (FA), statusCode, errorCode
// -------------------------------------------------------------
export default class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = "SERVER_ERROR") {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Marks error as expected/handled

    Error.captureStackTrace(this, this.constructor);
  }
}
