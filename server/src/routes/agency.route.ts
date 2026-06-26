import { Router } from "express";
import { getAgencyProfile, updateAgencyProfile, disconnectEmailConfig } from "../controllers/agency.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/profile", protect, getAgencyProfile);
router.put("/profile", protect, updateAgencyProfile);
router.delete("/email-config", protect, disconnectEmailConfig);

export default router;
