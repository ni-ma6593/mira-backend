// -------------------------------------------------------------
//  Category Controller
//  - Previously there was no public Category endpoint at all —
//    categories were only ever embedded inside the Home response.
//  - Exposes the Category/Subcategory tree, and category-scoped
//    product listing (reuses productRepository, paginated).
// -------------------------------------------------------------

import categoryRepository from "../repositories/category.repository.js";
import productRepository from "../repositories/product.repository.js";
import AppError from "../utils/AppError.js";

/**
 * @desc Get all categories as a nested tree (top-level + subcategories)
 * @route GET /api/v1/categories
 * @access Public
 */
export const getCategoryTree = async (req, res, next) => {
  try {
    const categories = await categoryRepository.findTree();
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get products belonging to a category (by slug), paginated
 * @route GET /api/v1/categories/:slug/products?page=1&limit=50
 * @access Public
 */
export const getCategoryProducts = async (req, res, next) => {
  try {
    const category = await categoryRepository.findBySlug(req.params.slug);
    if (!category) {
      throw new AppError("دسته‌بندی یافت نشد", 404, "CATEGORY_NOT_FOUND");
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = { category: category.name };

    const [products, total] = await Promise.all([
      productRepository.findMany({ filter, limit, skip }),
      productRepository.countDocuments(filter),
    ]);

    res.json({
      success: true,
      category,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};
