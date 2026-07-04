import { Router } from "express";
import { getLearnings } from "../controllers/learning.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getLearnings);

export default router;
