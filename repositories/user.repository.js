// -------------------------------------------------------------
//  User Repository
//  - Single place for all User database access
// -------------------------------------------------------------

import User from "../models/user.model.js";

class UserRepository {
  async findById(id, { lean = false } = {}) {
    const query = User.findById(id).select("-__v");
    return lean ? query.lean() : query;
  }

  async findByIdWithSavedProducts(id) {
    return User.findById(id).populate("savedProducts").select("savedProducts");
  }

  async findByPhone(phone) {
    return User.findOne({ phone });
  }

  async create(data) {
    return User.create(data);
  }

  async updateById(id, update) {
    return User.findByIdAndUpdate(id, { $set: update }, { new: true }).select(
      "-__v",
    );
  }
}

export default new UserRepository();
