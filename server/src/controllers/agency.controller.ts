import type { Response, NextFunction } from "express";
import { Agency } from "../models/agency.model";
import { sendSuccess, sendNotFound } from "../lib/responseHandler";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { getQueue } from "../engine/queue";

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

// GET /api/agency/agent-status
export async function streamAgentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Establish SSE connection immediately

    // Define queues to monitor
    const queues = {
      hunter: getQueue("hunt"),
      researcher: getQueue("research"),
      outreach: getQueue("outreach"),
      reply: getQueue("inbox"),
    };

    const fetchCounts = async () => {
      try {
        const payload: any = {};
        for (const [name, q] of Object.entries(queues)) {
          const counts = await q.getJobCounts("active", "waiting", "delayed");
          payload[name] = counts;
        }
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        console.error("[SSE] Failed to fetch queue counts", err);
      }
    };

    // Send immediately on connect
    await fetchCounts();

    // Poll every 2 seconds
    const interval = setInterval(fetchCounts, 2000);

    req.on("close", () => {
      clearInterval(interval);
      res.end();
    });
  } catch (err) {
    next(err);
  }
}
