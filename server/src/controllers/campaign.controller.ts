import type { Response, NextFunction } from "express";
import { Campaign } from "../models/campaign.model";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from "../lib/responseHandler";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import type { Types } from "mongoose";
import { startStrategistWorker } from "../engine/workers/strategist.worker";

// GET /api/campaigns
export async function getCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaigns = await Campaign.find({});
    return sendSuccess(res, campaigns, "Campaigns fetched");
  } catch (err) {
    next(err);
  }
}

// GET /api/campaigns/:id
export async function getCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return sendNotFound(res, "Campaign");
    return sendSuccess(res, campaign);
  } catch (err) {
    next(err);
  }
}

// POST /api/campaigns
export async function createCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, industry, location, companySize, excludeDomains, keywords, instructions, startDate, endDate, dailyLimit, followUpDays, schedule, warmupMode, channel, autoSend } = req.body;

    if (!name) return sendBadRequest(res, "Campaign name is required");

    const parsedKeywords = typeof keywords === "string"
      ? keywords.split(",").map(k => k.trim()).filter(Boolean)
      : Array.isArray(keywords) ? keywords : [];

    const parsedExclude = typeof excludeDomains === "string"
      ? excludeDomains.split(",").map(d => d.trim()).filter(Boolean)
      : Array.isArray(excludeDomains) ? excludeDomains : [];

    const campaign = await Campaign.create({
      name,
      status: "active",
      instructions: instructions,
      autoSend: autoSend,
      target:{
        industry: industry,
        location: {
          country: location?.country || "",
          state: location?.state || undefined,
          city: location?.city || undefined,
        },
        companySize: companySize || undefined,
        excludeDomains: parsedExclude,
        keywords: parsedKeywords,
      },
      channel: channel || "email",
      schedule: {
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 86400000), // 30 days in milliseconds
        dailyLimit: dailyLimit ? parseInt(dailyLimit) : 30,
        schedule: schedule ? parseInt(schedule) : 9,
        followUpDays: Array.isArray(followUpDays) ? followUpDays : [3, 7],
        warmupMode: typeof warmupMode === "boolean" ? warmupMode : true,
      },
    });

    const { getQueue } = await import("../engine/queue");
    const strategyQ = getQueue("strategy");
    
    startStrategistWorker();

    await strategyQ.add(
      "strategize",
      { campaignId: campaign._id.toString() },
      { jobId: `strategize-${campaign._id.toString()}` }
    );

    return sendCreated(res, campaign, "Campaign created and scheduled");
  } catch (err) {
    next(err);
  }
}

// PUT /api/campaigns/:id
export async function updateCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, industry, location, companySize, excludeDomains, keywords, instructions, startDate, endDate, dailyLimit, followUpDays, schedule, warmupMode, channel, autoSend, status } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (autoSend !== undefined) updateData.autoSend = autoSend;
    if (channel !== undefined) updateData.channel = channel;

    if (industry !== undefined) updateData["target.industry"] = industry;
    if (companySize !== undefined) updateData["target.companySize"] = companySize;
    if (location !== undefined) {
      if (location.country !== undefined) updateData["target.location.country"] = location.country;
      if (location.state !== undefined) updateData["target.location.state"] = location.state;
      if (location.city !== undefined) updateData["target.location.city"] = location.city;
    }
    if (keywords !== undefined) {
      updateData["target.keywords"] = typeof keywords === "string"
        ? keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
        : Array.isArray(keywords) ? keywords : [];
    }
    if (excludeDomains !== undefined) {
      updateData["target.excludeDomains"] = typeof excludeDomains === "string"
        ? excludeDomains.split(",").map((d: string) => d.trim()).filter(Boolean)
        : Array.isArray(excludeDomains) ? excludeDomains : [];
    }

    if (startDate) updateData["schedule.startDate"] = new Date(startDate);
    if (endDate) updateData["schedule.endDate"] = new Date(endDate);
    if (dailyLimit) updateData["schedule.dailyLimit"] = parseInt(dailyLimit);
    if (schedule) updateData["schedule.schedule"] = parseInt(schedule);
    if (followUpDays) updateData["schedule.followUpDays"] = Array.isArray(followUpDays) ? followUpDays : [3, 7];
    if (warmupMode !== undefined) updateData["schedule.warmupMode"] = warmupMode;

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: Object.keys(updateData).length > 0 ? updateData : req.body },
      { returnDocument: "after", runValidators: true }
    );

    if (!campaign) return sendNotFound(res, "Campaign");
    return sendSuccess(res, campaign, "Campaign updated");
  } catch (err) {
    next(err);
  }
}

// DELETE /api/campaigns/:id
export async function deleteCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return sendNotFound(res, "Campaign");
    return sendSuccess(res, null, "Campaign deleted");
  } catch (err) {
    next(err);
  }
}
