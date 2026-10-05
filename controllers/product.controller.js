// -------------------------------------------------------------
//  Product Controller
//  - Delegates data access to productRepository (no direct
//    Mongoose calls in the controller layer anymore)
//  - Response shapes are unchanged for existing clients; new
//    fields (comparison) are additive only.
// -------------------------------------------------------------

import productRepository from "../repositories/product.repository.js";
import compareEngineService from "../services/compare-engine.service.js";

/**
 * @desc Get a paginated list of products
 * @route GET /api/v1/products?page=1&limit=50
 * @access Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    const SORT_MAP = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      sales: { salesCount: -1 },
      newest: { createdAt: -1 },
    };
    const sort = SORT_MAP[req.query.sort] || {};

    const [products, total] = await Promise.all([
      productRepository.findMany({ filter, sort, limit, skip }),
      productRepository.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + products.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get a single product by its MongoDB ID
 * @route GET /api/v1/products/:id
 * @access Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await productRepository.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ product });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Search products and return 3 categorized result sets:
 *       - price_low: sorted by lowest price
 *       - rating_high: sorted by highest rating
 *       - sales_high: sorted by highest sales count
 * @route GET /api/v1/products/search/query?q=keyword
 * @access Public
 */
export const searchProducts = async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const projection = q ? { score: { $meta: "textScore" } } : {};

    const [priceLow, ratingHigh, salesHigh] = await Promise.all([
      productRepository.textSearch(q, { projection, sort: { price: 1 }, limit: 20 }),
      productRepository.textSearch(q, { projection, sort: { rating: -1 }, limit: 20 }),
      productRepository.textSearch(q, { projection, sort: { salesCount: -1 }, limit: 20 }),
    ]);

    res.json({
      price_low: priceLow,
      rating_high: ratingHigh,
      sales_high: salesHigh,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Compare multiple products by their IDs.
 *       Returns the raw product list (unchanged, for backward
 *       compatibility) PLUS a new `comparison` object with
 *       value scores, per-factor comparisons, a winner and a
 *       human-readable reasoning string.
 * @route GET /api/v1/products/compare/list?ids=1,2,3
 * @access Public
 */
export const compareProducts = async (req, res, next) => {
  try {
    const ids = req.query.ids?.split(",").filter(Boolean);

    if (!ids || ids.length === 0) {
      return res.json({ products: [] });
    }

    const products = await productRepository.findByIds(ids);

    // Comparison engine requires >= 2 products; for a single
    // product we just return it without a comparison block so
    // this endpoint keeps working the same way it always did.
    if (products.length < 2) {
      return res.json({ products });
    }

    const comparison = await compareEngineService.compare(ids);

    res.json({ products, comparison });
  } catch (err) {
    next(err);
  }
};
