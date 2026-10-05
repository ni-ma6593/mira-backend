import { Router } from "express";
import { getHome } from "../controllers/home.controller.js";
import { authOptional } from "../middlewares/authOptional.js";

const router = Router();

router.get("/", authOptional, getHome);

export default router;
