import { sendSuccess, sendError, sendNotFound, sendBadRequest } from "../lib/responseHandler";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import type { Response } from "express";

import { Lead } from "../models/lead.model";
import type { Types } from "mongoose";

export async function getAllLeads(req: AuthenticatedRequest, res: Response) {
    try {
        const leads = await Lead.find({});
        return sendSuccess(res, leads);
    } catch (error) {
        return sendError(res, error instanceof Error ? error.message : "Failed to fetch leads");
    }
}

export async function getLeadById(req: AuthenticatedRequest, res: Response) {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return sendNotFound(res, "Lead");
        return sendSuccess(res, lead);
    } catch (error) {
        return sendError(res, error instanceof Error ? error.message : "Failed to fetch lead");
    }
}

export async function deleteLead(req: AuthenticatedRequest, res: Response) {
    try {
        const lead = await Lead.findByIdAndDelete(req.params.id);
        if (!lead) return sendNotFound(res, "Lead");
        return sendSuccess(res, null, "Lead deleted");
    } catch (error) {
        return sendError(res, error instanceof Error ? error.message : "Failed to delete lead");
    }
}

export async function updateLead(req: AuthenticatedRequest, res: Response) {
    try {
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!lead) return sendNotFound(res, "Lead");

        // If the lead was just approved for outreach manually, trigger the Outreacher
        if (req.body.status === "approved" && req.body.humanApproved === true) {
            const { getQueue } = await import("../engine/queue");
            const outreachQueue = getQueue("outreach");
            await outreachQueue.add("draft_email", {
                campaignId: lead.campaignId.toString(),
                leadId: lead._id.toString(),
                autoSend: false,
            });
            console.log(`[Leads Controller] Queued forced-draft outreach for manually approved lead ${lead._id}`);
        }

        return sendSuccess(res, lead, "Lead updated successfully");
    } catch (error) {
        return sendError(res, error instanceof Error ? error.message : "Failed to update lead");
    }
}