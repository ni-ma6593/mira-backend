import service from "../services/product-intelligence.service.js";

class ProductIntelligenceController {
  async getProductIntelligence(req, res, next) {
    try {
      const { id } = req.params;

      const data = await service.analyze(id);
      if (!data) return res.status(404).json({ message: "Product not found" });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export default new ProductIntelligenceController();
