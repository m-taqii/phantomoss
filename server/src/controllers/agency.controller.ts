import type { Response, NextFunction } from "express";
import { Agency } from "../models/agency.model";
import { sendSuccess, sendNotFound, sendBadRequest } from "../lib/responseHandler";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { encrypt } from "../lib/crypto";

// GET /api/agency/profile
export async function getAgencyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const agency = await Agency.findById(req.agency?._id);
    if (!agency) return sendNotFound(res, "Agency");

    const agencyObj = agency.toObject();
    if (agencyObj.emailConfig?.imapPass) {
      agencyObj.emailConfig.imapPass = "••••••••";
    }

    return sendSuccess(res, agencyObj, "Agency profile fetched");
  } catch (err) {
    next(err);
  }
}

// PUT /api/agency/profile
export async function updateAgencyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const updatePayload = { ...req.body };

    // Encrypt the IMAP password before saving if it was changed
    if (updatePayload.emailConfig?.imapPass) {
      if (/^•+$/.test(updatePayload.emailConfig.imapPass)) {
        // Password wasn't changed (it's just masking dots), don't overwrite the encrypted value
        delete updatePayload.emailConfig.imapPass;
      } else {
        // A real new password was provided
        updatePayload.emailConfig.imapPass = encrypt(updatePayload.emailConfig.imapPass);
      }
    }

    const agency = await Agency.findByIdAndUpdate(
      req.agency?._id,
      { $set: updatePayload },
      { returnDocument: "after", runValidators: true }
    );
    if (!agency) return sendNotFound(res, "Agency");

    // Strip the encrypted password before sending back
    const agencyObj = agency.toObject();
    if (agencyObj.emailConfig?.imapPass) {
      agencyObj.emailConfig.imapPass = "••••••••";
    }

    return sendSuccess(res, agencyObj, "Agency profile updated");
  } catch (err) {
    next(err);
  }
}

// DELETE /api/agency/email-config — Disconnect inbox
export async function disconnectEmailConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const agency = await Agency.findByIdAndUpdate(
      req.agency?._id,
      {
        $unset: {
          "emailConfig.imapHost": "",
          "emailConfig.imapPort": "",
          "emailConfig.imapUser": "",
          "emailConfig.imapPass": "",
        }
      },
      { returnDocument: "after" }
    );
    if (!agency) return sendNotFound(res, "Agency");
    return sendSuccess(res, agency, "Email configuration disconnected");
  } catch (err) {
    next(err);
  }
}
