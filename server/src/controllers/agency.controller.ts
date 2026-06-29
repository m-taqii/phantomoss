import type { Response, NextFunction } from "express";
import { Agency } from "../models/agency.model";
import { sendSuccess, sendNotFound } from "../lib/responseHandler";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

// GET /api/agency/profile
export async function getAgencyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const agency = await Agency.findById(req.agency?._id);
    if (!agency) return sendNotFound(res, "Agency");
    return sendSuccess(res, agency.toObject(), "Agency profile fetched");
  } catch (err) {
    next(err);
  }
}

// PUT /api/agency/profile
export async function updateAgencyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Email config is sourced from .env — strip any emailConfig fields from the payload
    const { emailConfig: _ignored, ...updatePayload } = req.body;

    const agency = await Agency.findByIdAndUpdate(
      req.agency?._id,
      { $set: updatePayload },
      { returnDocument: "after", runValidators: true }
    );
    if (!agency) return sendNotFound(res, "Agency");

    return sendSuccess(res, agency.toObject(), "Agency profile updated");
  } catch (err) {
    next(err);
  }
}
