import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getMe,
  updateMe,
  toggleSavedProduct,
  getSavedProducts,
} from "../controllers/user.controller.js";

import { toggleSaveProduct } from "../controllers/user.controller.js";
import { authRequired } from "../middlewares/authRequired.js";
import { validateUpdateMe } from "../validators/user.validator.js";

const router = Router();

/**
 * @desc Get the authenticated user's profile
 * @route GET /api/v1/users/me
 * @access Private (requires valid JWT)
 */
router.get("/me", authMiddleware, getMe);

/**
 * @desc Update the authenticated user's profile
 * @route PATCH /api/v1/users/me
 * @access Private
 */
router.patch("/me", authMiddleware, validateUpdateMe, updateMe);

/**
 * @desc Add or remove a product from the user's saved list (toggle)
 * @route PATCH /api/v1/users/me/save-product
 * @access Private
 */
router.patch("/me/save-product", authMiddleware, toggleSavedProduct);

/**
 * @desc Get all saved products of the authenticated user
 * @route GET /api/v1/users/me/saved-products
 * @access Private
 */
router.get("/me/saved-products", authMiddleware, getSavedProducts);



router.post("/save-product", authRequired, toggleSaveProduct);

export default router;
