// -------------------------------------------------------------
//  Review Intelligence Service
//  - Rule based (V1, no AI): keyword matching + classification
//  - Reads real reviews via reviewRepository (not embedded fields)
//  - Produces category statistics AND human-readable summaries,
//    e.g. "اکثر کاربران از کیفیت ساخت راضی‌اند"
//    instead of raw counts like "125 positive reviews"
// -------------------------------------------------------------

import reviewRepository from "../repositories/review.repository.js";

// Keyword dictionaries per category (Persian). Extendable without
// touching the classification logic itself.
const CATEGORY_KEYWORDS = {
  quality: ["کیفیت", "عالی", "خوب", "ضعیف", "جنس"],
  shipping: ["ارسال", "پست", "تحویل", "دیر", "سریع"],
  price: ["قیمت", "گران", "ارزون", "ارزان", "به صرفه"],
  battery: ["باتری", "شارژ", "دوام باتری", "خالی"],
  durability: ["دوام", "خرابی", "شکست", "زوال", "طول عمر"],
  build_quality: ["ساخت", "بدنه", "متریال", "پلاستیک", "فلزی"],
  value: ["ارزش", "می‌ارزه", "میارزه", "به‌صرفه", "پول"],
};

const POSITIVE_WORDS = ["خوب", "عالی", "راضی", "پیشنهاد میکنم", "پیشنهاد می‌کنم"];
const NEGATIVE_WORDS = ["بد", "ضعیف", "ناراضی", "خراب", "پیشنهاد نمیکنم"];

function clean(text) {
  return (text || "").toLowerCase().replace(/[.,!؟?]/g, "");
}

function classify(text) {
  const t = clean(text);
  const result = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    result[category] = keywords.some((w) => t.includes(w)) ? 1 : 0;
  }

  return result;
}

function sentiment(text) {
  const t = clean(text);
  const isPositive = POSITIVE_WORDS.some((w) => t.includes(w));
  const isNegative = NEGATIVE_WORDS.some((w) => t.includes(w));

  if (isPositive && !isNegative) return "positive";
  if (isNegative && !isPositive) return "negative";
  return "neutral";
}

// Human-readable summary per category, based on the ratio of
// reviews mentioning it positively vs the total mentions.
function buildCategorySummary(category, mentionCount, positiveMentionCount) {
  const LABELS = {
    quality: "کیفیت",
    shipping: "ارسال",
    price: "قیمت",
    battery: "باتری",
    durability: "دوام",
    build_quality: "کیفیت ساخت",
    value: "ارزش خرید",
  };

  const label = LABELS[category] || category;

  if (mentionCount === 0) {
    return `کاربران درباره ${label} نظری ثبت نکرده‌اند.`;
  }

  const ratio = positiveMentionCount / mentionCount;

  if (ratio >= 0.7) return `اکثر کاربران از ${label} راضی‌اند.`;
  if (ratio >= 0.4) return `نظرات کاربران درباره ${label} متفاوت است.`;
  return `بسیاری از کاربران از ${label} ناراضی‌اند.`;
}

class ReviewIntelligenceService {
  /**
   * @param {String} productId
   * @returns {Object} review statistics + category breakdown + summaries
   */
  async analyze(productId) {
    const reviews = await reviewRepository.findByProduct(productId);

    const categories = {
      quality: { mentions: 0, positive: 0 },
      shipping: { mentions: 0, positive: 0 },
      price: { mentions: 0, positive: 0 },
      battery: { mentions: 0, positive: 0 },
      durability: { mentions: 0, positive: 0 },
      build_quality: { mentions: 0, positive: 0 },
      value: { mentions: 0, positive: 0 },
    };

    let positiveCount = 0;
    let negativeCount = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    for (const review of reviews) {
      const text = review.text || "";
      const tags = classify(text);
      const s = sentiment(text);

      for (const category of Object.keys(categories)) {
        if (tags[category]) {
          categories[category].mentions += 1;
          if (s === "positive") categories[category].positive += 1;
        }
      }

      if (s === "positive") positiveCount += 1;
      if (s === "negative") negativeCount += 1;

      if (typeof review.rating === "number") {
        ratingSum += review.rating;
        ratingCount += 1;
      }
    }

    const categoryStats = {};
    const categorySummaries = {};

    for (const [category, data] of Object.entries(categories)) {
      categoryStats[category] = data.mentions;
      categorySummaries[category] = buildCategorySummary(
        category,
        data.mentions,
        data.positive,
      );
    }

    const avgRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0;

    return {
      reviewStats: {
        avgRating,
        ratingCount: reviews.length,
        positiveCount,
        negativeCount,
      },
      categoryStats,
      categorySummaries,
    };
  }
}

export default new ReviewIntelligenceService();
