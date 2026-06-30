import { Router } from "express";
import { getAgencyProfile, updateAgencyProfile, streamAgentStatus } from "../controllers/agency.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/profile", protect, getAgencyProfile);
router.put("/profile", protect, updateAgencyProfile);
router.get("/agent-status", protect, streamAgentStatus);

export default router;
