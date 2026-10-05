import mongoose from "mongoose";

/**
 * Category Model
 * Used for showing fixed categories on Home Page, and for
 * grouping products via Product.category / Product.subcategory.
 *
 * Hierarchy: a category with `parent: null` is a top-level
 * category; a category with `parent` set is a subcategory of it.
 * Existing documents (all currently top-level) keep working
 * unchanged since `parent` defaults to null.
 */
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Title shown to user
    slug: { type: String, required: true, unique: true }, // For routing
    icon: { type: String, required: false }, // Optional icon URL

    // null/undefined = top-level category. Set to a Category._id
    // to make this a subcategory.
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null, index: true },

    // Display order within its level (top-level or within its parent)
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CategorySchema.index({ parent: 1, order: 1 });

const Category = mongoose.model("Category", CategorySchema);

export default Category;
