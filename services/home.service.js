// -------------------------------------------------------------
//  Home Service (Production-Ready)
//  - Returns home page sections for guest & logged-in users
//  - Personalized recommendations based on saved categories
//  - Data access goes through repositories only
// -------------------------------------------------------------

import productRepository from "../repositories/product.repository.js";
import categoryRepository from "../repositories/category.repository.js";
import bannerRepository from "../repositories/banner.repository.js";
import userRepository from "../repositories/user.repository.js";
import AppError from "../utils/AppError.js";

class HomeService {
  async getHomeData(userId) {
    // Load static sections
    const categories = await categoryRepository.findAll();
    const banner = await bannerRepository.findOne();

    // Load user if logged in
    let interests = [];

    if (userId) {
      const user = await userRepository.findById(userId, { lean: true });

      if (!user) {
        throw new AppError("کاربر یافت نشد", 404, "USER_NOT_FOUND");
      }

      interests = user.savedCategories || [];
    }

    // Guest mode OR no interests → fallback to default sections
    const isGuest = !userId || interests.length === 0;

    // Default amazing offers
    const amazing = await productRepository.findManyLean({
      filter: isGuest
        ? { isAmazing: true }
        : { isAmazing: true, category: { $in: interests } },
      sort: { price: 1 },
      limit: 10,
    });

    // Default best sellers
    const bestSellers = await productRepository.findManyLean({
      filter: isGuest ? {} : { category: { $in: interests } },
      sort: { salesCount: -1 },
      limit: 10,
    });

    // Personalized only for logged-in users with interests
    const personalized = isGuest
      ? []
      : await productRepository.findManyLean({
          filter: { category: { $in: interests } },
          sort: { rating: -1 },
          limit: 10,
        });

    return {
      search: { placeholder: "جستجو در میرا" },
      personalized,
      amazing,
      categories,
      banner,
      bestSellers,
    };
  }
}

export default new HomeService();
