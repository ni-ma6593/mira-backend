// -------------------------------------------------------------
//  Optional Authentication Middleware
//  - If token exists and is valid → attaches user to req.user
//  - If token is missing or invalid → continues as guest
//  - Never throws errors (because it's optional)
// -------------------------------------------------------------

import { verifyAndLoadUser } from "./auth.middleware.js";

export const authOptional = async (req, res, next) => {
  const auth = req.headers.authorization;

  // No token at all → continue as guest, don't even attempt verification
  if (!auth) {
    return next();
  }

  try {
    req.user = await verifyAndLoadUser(auth); // Attach user object (full Mongoose doc)
  } catch {
    // Invalid/expired token → continue as guest, same as before
  }

  next();
};
