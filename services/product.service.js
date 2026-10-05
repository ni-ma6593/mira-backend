// -------------------------------------------------------------
//  Product Service (Production-Ready)
//  - Saves mapped product from crawler / mapper
//  - Validates required fields
//  - Prevents duplicate products by source + sourceId
// -------------------------------------------------------------

import productRepository from "../repositories/product.repository.js";
import AppError from "../utils/AppError.js";

class ProductService {
  async saveMappedProduct(mapped) {
    // Validate required fields
    if (!mapped.title || !mapped.price || !mapped.source || !mapped.sourceId) {
      throw new AppError(
        "اطلاعات محصول ناقص است",
        400,
        "PRODUCT_DATA_INCOMPLETE",
      );
    }

    // Prevent duplicates (same source + sourceId)
    const existing = await productRepository.findOneBySource(
      mapped.source,
      mapped.sourceId,
    );

    if (existing) {
      throw new AppError(
        "این محصول قبلاً ذخیره شده است",
        409,
        "PRODUCT_ALREADY_EXISTS",
      );
    }

    // Save product
    const product = await productRepository.create(mapped);

    return product.toObject();
  }

  /**
   * Create-or-update variant used by ingestion pipelines (Basalam /
   * Technolife sync): re-running an import updates existing products
   * (price/stock/etc. change over time) instead of treating every
   * re-sync as a duplicate error.
   * @returns {{ product: Object, created: boolean }}
   */
  async upsertMappedProduct(mapped) {
    if (!mapped.title || !mapped.price || !mapped.source || !mapped.sourceId) {
      throw new AppError(
        "اطلاعات محصول ناقص است",
        400,
        "PRODUCT_DATA_INCOMPLETE",
      );
    }

    const existing = await productRepository.findOneBySource(
      mapped.source,
      mapped.sourceId,
    );

    if (existing) {
      const updated = await productRepository.updateById(existing._id, mapped);
      return { product: updated.toObject(), created: false };
    }

    const product = await productRepository.create(mapped);
    return { product: product.toObject(), created: true };
  }
}

export default new ProductService();
