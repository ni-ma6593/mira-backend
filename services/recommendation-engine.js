// -------------------------------------------------------------
//  Recommendation Engine
//  - DEPRECATED: this file previously duplicated the scoring
//    formula now implemented once in services/value-score.service.js.
//  - Kept for backward compatibility (in case anything imports
//    it directly) — it now delegates to the canonical Value
//    Score module instead of recalculating the same formula.
// -------------------------------------------------------------

import { calculateValueScore } from "./value-score.service.js";
import AppError from "../utils/AppError.js";

class RecommendationEngine {
  calculateScore(product) {
    if (!product) {
      throw new AppError(
        "محصول برای امتیازدهی یافت نشد",
        400,
        "PRODUCT_REQUIRED",
      );
    }

    return calculateValueScore(product);
  }
}

export default new RecommendationEngine();
