// src/routes/product-intelligence.routes.js

import { Router } from "express";
import { authOptional } from "../middlewares/authOptional.js";
import productIntelligenceMiddleware from "../middlewares/product-intelligence.middleware.js";
import controller from "../controllers/product-intelligence.controller.js";

const router = Router();

router.get(
  "/products/:id/intelligence",
  authOptional,
  productIntelligenceMiddleware,
  controller.getProductIntelligence,
);

export default router;
