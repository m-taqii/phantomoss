import { Router } from "express";
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "../controllers/campaign.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getCampaigns);
router.get("/:id", protect, getCampaign);
router.post("/", protect, createCampaign);
router.put("/:id", protect, updateCampaign);
router.delete("/:id", protect, deleteCampaign);

export default router;
