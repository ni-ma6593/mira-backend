// -------------------------------------------------------------
//  Category Repository
// -------------------------------------------------------------

import Category from "../models/category.model.js";

class CategoryRepository {
  async findAll() {
    return Category.find({}).lean();
  }

  /**
   * Returns top-level categories, each with its subcategories
   * nested under `subcategories`. Two queries total (not N+1).
   */
  async findTree() {
    const all = await Category.find({}).sort({ order: 1 }).lean();
    const byParent = new Map();

    for (const cat of all) {
      const key = cat.parent ? String(cat.parent) : "root";
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(cat);
    }

    const attachChildren = (cat) => ({
      ...cat,
      subcategories: (byParent.get(String(cat._id)) || []).map(attachChildren),
    });

    return (byParent.get("root") || []).map(attachChildren);
  }

  async findSubcategories(parentId) {
    return Category.find({ parent: parentId }).sort({ order: 1 }).lean();
  }

  async findBySlug(slug) {
    return Category.findOne({ slug }).lean();
  }
}

export default new CategoryRepository();
