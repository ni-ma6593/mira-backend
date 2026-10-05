// -------------------------------------------------------------
//  Product Intelligence Service (Production-Ready)
//  - Orchestrates Price Intelligence + Review Intelligence +
//    Value Score into one API response
//  - Rule based (V1, no AI). Each sub-module can be swapped for
//    an AI-driven implementation later without changing this
//    service's public response shape.
//
//  Backward compatibility: the original response fields
//  (aiScore, aiBadges, reviewStats, categoryStats) are preserved
//  exactly. New fields (priceIntelligence, reviewIntelligence)
//  are additive only.
// -------------------------------------------------------------

import productRepository from "../repositories/product.repository.js";
import AppError from "../utils/AppError.js";
import priceIntelligenceService from "./price-intelligence.service.js";
import reviewIntelligenceService from "./review-intelligence.service.js";
import { calculateValueScore } from "./value-score.service.js";

class ProductIntelligenceService {
  async analyze(productId) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new AppError("محصول یافت نشد", 404, "PRODUCT_NOT_FOUND");
    }

    // --- Price Intelligence -------------------------------------------
    const priceIntelligence = priceIntelligenceService.analyze(product);

    // --- Review Intelligence (reads real Review documents) ------------
    const { reviewStats, categoryStats, categorySummaries } =
      await reviewIntelligenceService.analyze(productId);

    // avgRating falls back to the product's own rating field when
    // there are no classified reviews yet, so V1 behaves the same
    // as before for products without a Review collection populated.
    if (!reviewStats.ratingCount) {
      reviewStats.avgRating = product.rating || 0;
    }

    // --- Value Score -----------------------------------------------------
    const aiScore = calculateValueScore(product, {
      minPrice: priceIntelligence.lowestPrice,
      maxPrice: priceIntelligence.highestPrice,
    });

    // --- Badges ----------------------------------------------------------
    const aiBadges = [];
    if (aiScore > 8) aiBadges.push("high_value");
    if (product.shippingDays <= 2) aiBadges.push("fast_shipping");
    if (product.rating >= 4.5) aiBadges.push("top_rated");

    // Persist computed intelligence fields on the product (unchanged
    // behavior from the original implementation)
    await productRepository.updateById(productId, {
      aiScore,
      aiBadges,
      reviewStats,
      categoryStats,
    });

    return {
      aiScore,
      aiBadges,
      reviewStats,
      categoryStats,
      priceIntelligence,
      reviewIntelligence: {
        categorySummaries,
      },
    };
  }
}

export default new ProductIntelligenceService();
