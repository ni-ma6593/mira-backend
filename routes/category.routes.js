import { Router } from "express";
import { getCategoryTree, getCategoryProducts } from "../controllers/category.controller.js";

const router = Router();

/**
 * @desc Get all categories (nested: top-level + subcategories)
 * @route GET /api/v1/categories
 * @access Public
 */
router.get("/", getCategoryTree);

/**
 * @desc Get products in a category (paginated)
 * @route GET /api/v1/categories/:slug/products
 * @access Public
 */
router.get("/:slug/products", getCategoryProducts);

export default router;
