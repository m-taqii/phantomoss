import { Router } from "express";
import { getAgencyProfile, updateAgencyProfile } from "../controllers/agency.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/profile", protect, getAgencyProfile);
router.put("/profile", protect, updateAgencyProfile);

export default router;
