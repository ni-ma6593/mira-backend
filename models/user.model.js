import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },

    // Profile Info
    firstName: { type: String },
    lastName: { type: String },
    avatarUrl: { type: String },
    bio: { type: String },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },

    birthDate: { type: Date },

    // Saved Products (Wishlist)
    savedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // Last 5 categories user interacted with
    savedCategories: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
