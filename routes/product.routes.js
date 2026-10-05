import { Router } from "express";
import {
  getProducts,
  getProductById,
  searchProducts,
  compareProducts
} from "../controllers/product.controller.js";

const router = Router();

/**
 * @desc Get a list of products (default limit: 50)
 * @route GET /api/v1/products
 * @access Public
 */
router.get("/", getProducts);

/**
 * @desc Get a single product by its ID
 * @route GET /api/v1/products/:id
 * @access Public
 */
router.get("/:id", getProductById);

/**
 * @desc Search products and return 3 categorized result sets:
 *       - price_low
 *       - rating_high
 *       - sales_high
 * @route GET /api/v1/products/search/query?q=keyword
 * @access Public
 */
router.get("/search/query", searchProducts);

/**
 * @desc Compare multiple products by their IDs
 * @route GET /api/v1/products/compare/list?ids=1,2,3
 * @access Public
 */
router.get("/compare/list", compareProducts);

export default router;
