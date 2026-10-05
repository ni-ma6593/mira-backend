// -------------------------------------------------------------
//  Product Repository
//  - Single place for all Product database access
//  - Services must NOT talk to the Product model directly
//  - Keeps Mongoose-specific code out of the business logic layer
// -------------------------------------------------------------

import Product from "../models/product.model.js";

class ProductRepository {
  async findById(id) {
    return Product.findById(id);
  }

  async findByIdLean(id) {
    return Product.findById(id).lean();
  }

  async findByIds(ids) {
    return Product.find({ _id: { $in: ids } });
  }

  async findMany({ filter = {}, sort = {}, limit = 50, skip = 0 } = {}) {
    return Product.find(filter).sort(sort).skip(skip).limit(limit);
  }

  async countDocuments(filter = {}) {
    return Product.countDocuments(filter);
  }

  async findManyLean({ filter = {}, sort = {}, limit = 50 } = {}) {
    return Product.find(filter).sort(sort).limit(limit).lean();
  }

  async textSearch(query, { projection = {}, sort = {}, limit = 20 } = {}) {
    const filter = query ? { $text: { $search: query } } : {};
    return Product.find(filter, projection).sort(sort).limit(limit);
  }

  async findOneBySource(source, sourceId) {
    return Product.findOne({ source, sourceId });
  }

  async create(data) {
    return Product.create(data);
  }

  async updateById(id, update) {
    return Product.findByIdAndUpdate(id, update, { new: true });
  }
}

export default new ProductRepository();
