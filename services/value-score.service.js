// -------------------------------------------------------------
//  Value Score Service
//  - Single, canonical implementation of the weighted scoring
//    formula previously duplicated in product-intelligence.service.js
//    and recommendation-engine.js
//  - Rule based (V1). Designed to be swapped for an AI-driven
//    implementation later WITHOUT changing its public signature,
//    so callers (Compare Engine, Product Intelligence, Home
//    Recommendations) never need to change.
// -------------------------------------------------------------

const WEIGHTS = {
  price: 0.4,
  rating: 0.3,
  store: 0.2,
  shipping: 0.1,
};

/**
 * Normalizes a product's price into a 0-10 score relative to a
 * min/max range (10 = cheapest, 0 = most expensive).
 */
function priceScore(price, minPrice, maxPrice) {
  if (minPrice === maxPrice) return 10;
  const score = 10 - ((price - minPrice) / (maxPrice - minPrice)) * 10;
  return Math.max(0, Math.min(score, 10));
}

/**
 * Normalizes shipping days into a 0-10 score (fewer days = higher score).
 */
function shippingScore(shippingDays) {
  const days = shippingDays ?? 5;
  return Math.max(0, 10 - days);
}

/**
 * Calculates the overall Value Score (0-10) for a product.
 *
 * @param {Object} product - Mongoose document or plain object. Expected
 *   fields: price, rating, storeRating, shippingDays, reviewStats.avgRating
 * @param {Object} range - { minPrice, maxPrice } across the comparison set.
 *   If omitted, price contributes its raw priceScore based on itself only.
 * @returns {number} value score rounded to 2 decimals
 */
export function calculateValueScore(product, range = {}) {
  if (!product) return 0;

  const minPrice = range.minPrice ?? product.price;
  const maxPrice = range.maxPrice ?? product.price;

  const pScore = priceScore(product.price, minPrice, maxPrice);
  const ratingValue = product.reviewStats?.avgRating ?? product.rating ?? 0;
  const rScore = ratingValue * 2; // rating is 0-5 -> normalize to 0-10
  const sScore = (product.storeRating || 0) * 2;
  const shipScore = shippingScore(product.shippingDays);

  const total =
    pScore * WEIGHTS.price +
    rScore * WEIGHTS.rating +
    sScore * WEIGHTS.store +
    shipScore * WEIGHTS.shipping;

  return Number(total.toFixed(2));
}

/**
 * Convenience helper: calculates value scores for a list of products
 * using a shared min/max price range so scores are comparable
 * against each other (used by the Compare Engine).
 */
export function calculateValueScores(products) {
  const prices = products.map((p) => p.price).filter((p) => typeof p === "number");
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return products.map((product) => ({
    productId: product._id,
    valueScore: calculateValueScore(product, { minPrice, maxPrice }),
  }));
}

export default {
  calculateValueScore,
  calculateValueScores,
};
