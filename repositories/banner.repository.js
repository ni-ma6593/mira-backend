// -------------------------------------------------------------
//  Banner Repository
// -------------------------------------------------------------

import Banner from "../models/banner.model.js";

class BannerRepository {
  async findOne() {
    return Banner.findOne({}).lean();
  }
}

export default new BannerRepository();
