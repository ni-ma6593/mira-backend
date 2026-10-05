import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    index: true,
  },
  source: { type: String }, // basalam, digikala, torob...
  text: { type: String },
  rating: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

reviewSchema.index({ product: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
