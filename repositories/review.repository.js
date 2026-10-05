// -------------------------------------------------------------
//  Review Repository
//  - Single place for all Review database access
// -------------------------------------------------------------

import Review from "../models/review.model.js";

class ReviewRepository {
  async findByProduct(productId, { limit = 500 } = {}) {
    return Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async countByProduct(productId) {
    return Review.countDocuments({ product: productId });
  }

  async create(data) {
    return Review.create(data);
  }
}

export default new ReviewRepository();
