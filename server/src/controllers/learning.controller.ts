import type { Response, NextFunction } from "express";
import { Learning } from "../models/learning.model";
import { sendSuccess } from "../lib/responseHandler";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

// GET /api/learnings
export async function getLearnings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Fetch learnings, populate campaign name, sort by newest first
    const learnings = await Learning.find({})
      .populate("campaignId", "name")
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Learning.countDocuments({});

    return sendSuccess(res, {
      learnings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }, "Learnings fetched successfully");
  } catch (err) {
    next(err);
  }
}
