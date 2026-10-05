import mongoose from "mongoose";

// Define the Product schema structure
const productSchema = new mongoose.Schema(
  {
    // Product title (required)
    title: { type: String, required: true },

    // URL-safe unique identifier, auto-generated from title if not
    // provided (see pre-validate hook below). Used for pretty product
    // URLs (e.g. /products/apple-iphone-15).
    slug: { type: String, unique: true, sparse: true, index: true },

    // Long-form product description (optional — many source feeds
    // don't provide one; UI should fall back gracefully)
    description: { type: String },

    // Product brand (optional)
    brand: { type: String },

    // Product category (indexed for faster filtering)
    category: { type: String, index: true },

    // Optional subcategory, references Category._id when the
    // Category/Subcategory hierarchy (see category.model.js) is used
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true },

    // Main price (lowest available price)
    price: { type: Number, required: true },

    // Pre-discount price, when the product is on sale. If absent,
    // the product isn't considered discounted.
    originalPrice: { type: Number },

    // Discount percentage (0-100). Not auto-derived from
    // originalPrice/price so importers can set it explicitly when
    // the source feed provides it directly.
    discount: { type: Number, min: 0, max: 100, default: 0 },

    // Inventory count, when known from the source feed
    stock: { type: Number, default: null },

    // Availability status — independent from `stock` because many
    // source feeds report availability without exact quantities
    availability: {
      type: String,
      enum: ["in_stock", "out_of_stock", "preorder", "unknown"],
      default: "unknown",
    },

    // Main product image URL (kept for backward compatibility)
    image: { type: String },

    // Full image gallery. `image` above is treated as the cover/
    // first image where a single image is expected.
    images: { type: [String], default: [] },

    // Free-form key/value technical specs (existing field, unchanged)
    specs: { type: Object, default: {} },

    // Structured specification groups, e.g. { "دوربین": { "رزولوشن": "48MP" } }
    // Complements `specs` for richer, groupable spec display.
    specifications: { type: Object, default: {} },

    // Arbitrary product attributes (e.g. color, size) used for
    // filtering — separate from `specs`/`specifications` because
    // attributes are typically used for faceted search/filtering.
    attributes: { type: Object, default: {} },

    // Free-text tags for search/filtering
    tags: { type: [String], default: [], index: true },

    // Source of the product (e.g., basalam, technolife)
    source: { type: String, required: true },

    // Product ID from the external source
    sourceId: { type: String, required: true },

    // Direct link to the product on the external source
    url: { type: String },

    // Affiliate links for different platforms
    affiliate: {
      basalam: { type: String },
      technolife: { type: String },
    },

    // Per-store offers, used by Price Intelligence to compare
    // lowest / highest / average price across stores
    offers: [
      {
        store: { type: String },
        price: { type: Number },
        url: { type: String },
      },
    ],

    // Marks a product as part of the "Amazing Offers" home section
    isAmazing: { type: Boolean, default: false },

    // Rating score (used for sorting in search results)
    rating: { type: Number, default: 0 },

    // Store's own rating (0-5), distinct from the aggregated
    // customer `rating` above. Read by value-score.service.js;
    // previously undefined on every document.
    storeRating: { type: Number, default: 0, min: 0, max: 5 },

    // Estimated shipping time in days. Read by value-score.service.js
    // and product-intelligence.service.js (fast_shipping badge);
    // previously undefined on every document.
    shippingDays: { type: Number, default: null },

    // Sales count (used for sorting in search results)
    salesCount: { type: Number, default: 0 },

    // Combined searchable text for MongoDB text search
    searchableText: { type: String, index: "text" },
    aiScore: { type: Number, index: true }, // امتیاز نهایی محصول
    aiBadges: [{ type: String }], // مثل: ["high_value", "fast_shipping"]
    reviewStats: {
      avgRating: Number,
      ratingCount: Number,
      positiveCount: Number,
      negativeCount: Number,
    },
    categoryStats: {
      quality: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      battery: { type: Number, default: 0 },
    },
  },

  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  },
);

// Auto-generate a URL-safe slug from the title when one isn't
// provided, so existing import flows that don't set `slug` keep
// working without a required-field validation error.
productSchema.pre("validate", function autoSlug(next) {
  if (!this.slug && this.title) {
    const base = this.title
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9آ-ی\s-]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    // Suffix with sourceId to keep slugs unique across similarly
    // named products from different sources.
    this.slug = this.sourceId ? `${base}-${this.sourceId}` : base;
  }
  next();
});

// Create a text index for full‑text search
productSchema.index({ searchableText: "text" });
productSchema.index({ "reviewStats.avgRating": -1 });
productSchema.index({ aiScore: -1 });
productSchema.index({ category: 1, subcategory: 1 });


// Export the Product model
const Product = mongoose.model("Product", productSchema);
export default Product;
