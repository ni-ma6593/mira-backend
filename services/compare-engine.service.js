// -------------------------------------------------------------
//  Compare Engine Service
//  - Rule based (V1, no AI)
//  - Calculates Value Score, Price/Rating/Popularity/Review
//    comparisons, picks a winner, and explains why (reasoning).
//  - The API response shape is stable on purpose: a future AI
//    engine can replace the internals of this file without any
//    change required in the controller/route layer.
// -------------------------------------------------------------

import productRepository from "../repositories/product.repository.js";
import reviewIntelligenceService from "./review-intelligence.service.js";
import { calculateValueScore } from "./value-score.service.js";
import AppError from "../utils/AppError.js";

class CompareEngineService {
  /**
   * @param {String[]} productIds
   * @returns {Object} { items: [...], winner, reasoning }
   */
  async compare(productIds) {
    if (!Array.isArray(productIds) || productIds.length < 2) {
      throw new AppError(
        "برای مقایسه حداقل به دو محصول نیاز است",
        400,
        "COMPARE_MIN_TWO_PRODUCTS",
      );
    }

    const products = await productRepository.findByIds(productIds);

    if (products.length < 2) {
      throw new AppError(
        "محصولات کافی برای مقایسه یافت نشد",
        404,
        "COMPARE_PRODUCTS_NOT_FOUND",
      );
    }

    const prices = products.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const ratings = products.map((p) => p.reviewStats?.avgRating ?? p.rating ?? 0);
    const maxRating = Math.max(...ratings);

    const salesCounts = products.map((p) => p.salesCount || 0);
    const maxSales = Math.max(...salesCounts);

    // Review intelligence per product — falls back to the
    // product's precomputed reviewStats if it already has one,
    // otherwise recomputes from raw reviews.
    const reviewData = await Promise.all(
      products.map(async (p) => {
        if (p.reviewStats && p.reviewStats.ratingCount > 0) {
          return { reviewStats: p.reviewStats };
        }
        try {
          return await reviewIntelligenceService.analyze(p._id);
        } catch {
          return { reviewStats: { avgRating: 0, ratingCount: 0, positiveCount: 0, negativeCount: 0 } };
        }
      }),
    );

    const items = products.map((product, index) => {
      const valueScore = calculateValueScore(product, { minPrice, maxPrice });
      const rating = ratings[index];
      const sales = salesCounts[index];
      const stats = reviewData[index].reviewStats;

      return {
        productId: product._id,
        title: product.title,
        price: product.price,
        rating,
        salesCount: sales,
        valueScore,
        priceComparison: {
          price: product.price,
          isCheapest: product.price === minPrice,
          differenceFromCheapest: Number((product.price - minPrice).toFixed(0)),
        },
        ratingComparison: {
          rating,
          isHighestRated: rating === maxRating && maxRating > 0,
        },
        popularityComparison: {
          salesCount: sales,
          isMostPopular: sales === maxSales && maxSales > 0,
        },
        reviewComparison: {
          avgRating: stats.avgRating,
          ratingCount: stats.ratingCount,
          positiveCount: stats.positiveCount,
          negativeCount: stats.negativeCount,
        },
      };
    });

    const winner = items.reduce((best, current) =>
      current.valueScore > best.valueScore ? current : best,
    );

    return {
      items,
      winner: {
        productId: winner.productId,
        title: winner.title,
        valueScore: winner.valueScore,
      },
      reasoning: this._buildReasoning(winner, items),
    };
  }

  _buildReasoning(winner, items) {
    const reasons = [];

    if (winner.priceComparison.isCheapest) {
      reasons.push("پایین‌ترین قیمت را در بین گزینه‌ها دارد");
    }
    if (winner.ratingComparison.isHighestRated) {
      reasons.push("بالاترین امتیاز کاربران را دارد");
    }
    if (winner.popularityComparison.isMostPopular) {
      reasons.push("پرفروش‌ترین گزینه در این مقایسه است");
    }

    if (reasons.length === 0) {
      return `${winner.title} با در نظر گرفتن مجموع قیمت، امتیاز کاربران و محبوبیت، بهترین ارزش خرید را در این مقایسه دارد.`;
    }

    return `${winner.title} به دلیل اینکه ${reasons.join(" و ")}، بهترین ارزش خرید را در این مقایسه دارد.`;
  }
}

export default new CompareEngineService();
