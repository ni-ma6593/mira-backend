// -------------------------------------------------------------
//  User Controller
//  - req.user is always the full user document, loaded by
//    auth.middleware.js (see fix notes there). Uses req.user._id
//    consistently (works whether the doc is lean or not).
// -------------------------------------------------------------

import userRepository from "../repositories/user.repository.js";
import productRepository from "../repositories/product.repository.js";
import { updateUserCategories } from "../utils/user-interests.js";

/**
 * @desc Get the profile of the currently authenticated user
 * @route GET /api/v1/users/me
 * @access Private (requires authentication)
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Update the authenticated user's profile
 * @route PATCH /api/v1/users/me
 * @access Private
 */
export const updateMe = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Only allow specific fields to be updated
    const allowedFields = [
      "firstName",
      "lastName",
      "avatarUrl",
      "bio",
      "gender",
      "birthDate",
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await userRepository.updateById(userId, updates);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Add or remove a product from the user's saved list (toggle behavior)
 *       Also updates the user's savedCategories (used for Home
 *       personalization) when a product is newly saved.
 *
 *       This replaces the two previously duplicated toggle
 *       implementations (toggleSavedProduct / toggleSaveProduct).
 *       Both routes now point here; `toggleSaveProduct` is kept
 *       exported as an alias for backward compatibility with any
 *       existing imports.
 *
 * @route PATCH /api/v1/users/me/save-product
 * @route POST  /api/v1/users/save-product
 * @access Private
 */
export const toggleSavedProduct = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadySaved = user.savedProducts.some(
      (id) => id.toString() === productId,
    );

    if (alreadySaved) {
      user.savedProducts = user.savedProducts.filter(
        (id) => id.toString() !== productId,
      );
      await user.save();
    } else {
      const product = await productRepository.findByIdLean(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      user.savedProducts.push(productId);
      await updateUserCategories(user, product.category);
    }

    res.json({
      success: true,
      saved: !alreadySaved,
      message: alreadySaved
        ? "Product removed from saved list"
        : "Product added to saved list",
      savedProducts: user.savedProducts,
      savedCategories: user.savedCategories,
    });
  } catch (err) {
    next(err);
  }
};

// Backward-compatible alias — kept in case anything still imports
// the old name directly.
export const toggleSaveProduct = toggleSavedProduct;

/**
 * @desc Get all saved products of the authenticated user
 * @route GET /api/v1/users/me/saved-products
 * @access Private
 */
export const getSavedProducts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await userRepository.findByIdWithSavedProducts(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ savedProducts: user.savedProducts });
  } catch (err) {
    next(err);
  }
};
