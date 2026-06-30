import { sendSuccess, sendError, sendNotFound, sendBadRequest } from "../lib/responseHandler";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import type { Response } from "express";
import { Outreach } from "../models/outreach.model";
import { Lead } from "../models/lead.model";
import type { Types } from "mongoose";
import { sendEmail } from "../lib/email";
import { Agency } from "../models/agency.model";

export async function getOutreachMessages(req: AuthenticatedRequest, res: Response) {
    try {
        const messages = await Outreach.find({}).populate("leadId", "company.name contact.name contact.email").sort({ createdAt: -1 });
        return sendSuccess(res, messages);
    } catch (error) {
        return sendError(res, error instanceof Error ? error.message : "Failed to fetch outreach messages");
    }
}

export async function approveOutreachDraft(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const { subject, body } = req.body;

        if (!subject || !body) return sendBadRequest(res, "Subject and body are required");

        const outreach = await Outreach.findOne({ _id: id, status: "draft" }).populate("leadId");
        if (!outreach) return sendNotFound(res, "Draft Outreach Message");

        const lead = outreach.leadId as any;
        const contactEmail = lead?.contact?.email;
        if (!contactEmail) return sendBadRequest(res, "Lead has no email address");

        // Send email
        const info = await sendEmail({
            to: contactEmail,
            subject: subject,
            text: body,
        });

        // Update outreach status to sent
        outreach.status = "sent";
        outreach.message.subject = subject;
        outreach.message.body = body;
        outreach.messageId = info.messageId;
        outreach.sentAt = new Date();
        await outreach.save();

        // Update lead status
        await Lead.findByIdAndUpdate(lead._id, { status: "contacted", lastContactedAt: new Date() });

        // Update campaign stats
        if (outreach.campaignId) {
            const { Campaign } = await import("../models/campaign.model");
            await Campaign.findByIdAndUpdate(outreach.campaignId, { $inc: { "stats.emailsSent": 1 } });
        }

        return sendSuccess(res, outreach, "Draft approved and email sent successfully");
    } catch (error) {
        return sendError(res, error instanceof Error ? error.message : "Failed to approve draft");
    }
}
