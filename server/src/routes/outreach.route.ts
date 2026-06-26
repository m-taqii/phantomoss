import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { getOutreachMessages, approveOutreachDraft } from "../controllers/outreach.controller";

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

router.get("/", getOutreachMessages);
router.post("/:id/send", approveOutreachDraft);

export default router;
