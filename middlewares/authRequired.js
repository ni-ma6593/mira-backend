// -------------------------------------------------------------
//  Authentication Required Middleware
//  - Validates JWT Access Token
//  - Loads user from DB
//  - Blocks request if token is missing or invalid
//  - Uses AppError for unified error handling
// -------------------------------------------------------------

import { verifyAndLoadUser } from "./auth.middleware.js";

export const authRequired = async (req, res, next) => {
  const user = await verifyAndLoadUser(req.headers.authorization);
  req.user = user; // Attach user object (full Mongoose doc, matches auth.middleware.js)
  next();
};
