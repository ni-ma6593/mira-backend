// -------------------------------------------------------------
//  Product Intelligence Context Middleware
//  - Extracts user info for recommendation & AI analysis
//  - Never throws errors (works for both guest & logged-in users)
//  - Provides a clean context object for downstream services
// -------------------------------------------------------------

export default function productIntelligence(req, res, next) {
  req.intelligenceContext = {
    userId: req.user?._id || null,
    likedCategories: req.user?.likedCategories || [],
  };

  next();
}
