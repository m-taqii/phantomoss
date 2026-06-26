import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { deleteLead, getAllLeads, getLeadById, updateLead } from "../controllers/leads.controller";

const router = Router();

router.get("/", protect, getAllLeads);
router.get("/:id", protect, getLeadById);
router.put("/:id", protect, updateLead);
router.delete("/:id", protect, deleteLead);

export default router;
