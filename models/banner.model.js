import mongoose from "mongoose";

/**
 * Banner Model
 * Used for showing promotional banner on Home Page
 */
const BannerSchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // Banner image URL
    url: { type: String, required: false }, // Optional redirect link
  },
  { timestamps: true },
);

const Banner = mongoose.model("Banner", BannerSchema);
export default Banner;
