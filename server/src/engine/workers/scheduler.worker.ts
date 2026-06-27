import { Worker } from "bullmq";
import { redisConnection } from "../../lib/redis";
import { getQueue } from "../queue";
import { startHunterWorker } from "./hunter.worker";
import { startOutreacherWorker } from "./outreacher.worker";
import { startLearnerWorker } from "./learner.worker";
import { Campaign } from "../../models/campaign.model";
import { Lead } from "../../models/lead.model";

//Adds a random jitter to a Date (between 0 and maxMinutes)
function addJitterToDate(date: Date, maxMinutes: number = 5): Date {
    const jitterMs = Math.floor(Math.random() * maxMinutes * 60 * 1000);
    return new Date(date.getTime() + jitterMs);
}

// A single global worker for the scheduler control plane
export const schedulerWorker = new Worker("scheduler-jobs", async (job) => {
    console.log(`[Scheduler Worker] Processing scheduled trigger ${job.id}`);
    const { campaignId } = job.data;

    // 1. Verify campaign is still active
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== "active") {
        console.log(`[Scheduler] Campaign ${campaignId} is no longer active. Stopping schedule.`);
        return;
    }

    // 2. Trigger the Hunter for this campaign
    const huntQueue = getQueue("hunt");
    await huntQueue.add("hunt", { campaignId });
    console.log(`[Scheduler] Enqueued hunt job for Campaign ${campaignId} to queue ${huntQueue.name}`);

    // 3. Wake up the isolated worker
    startHunterWorker();

    // 4. Autonomously dispatch Outreacher
    // Determine daily limit, considering warmup mode
    let effectiveLimit = campaign.schedule?.dailyLimit || 30;
    if (campaign.schedule?.warmupMode) {
        // Very simple warmup: cap at 10 if total emails sent < 50
        const totalSent = campaign.stats?.emailsSent || 0;
        if (totalSent < 50) {
            effectiveLimit = Math.min(effectiveLimit, 10);
            console.log(`[Scheduler] Campaign ${campaignId} is in warmup mode. Limiting to ${effectiveLimit} emails.`);
        }
    }

    const readyLeads = await Lead.find({
        campaignId,
        status: "researched"
    }).limit(effectiveLimit);

    if (readyLeads.length > 0) {
        console.log(`[Scheduler] Autonomously dispatching ${readyLeads.length} leads for outreach.`);
        
        const outreachQ = getQueue("outreach");
        const outreachJobs = readyLeads.map(lead => ({
            name: "initial-outreach",
            data: {
                campaignId: campaignId,
                leadId: lead._id.toString(),
                type: "initial",
                autoSend: campaign.autoSend
            }
        }));

        // Mark them as in_progress to prevent double sending before the worker finishes
        const leadIds = readyLeads.map(l => l._id);
        await Lead.updateMany({ _id: { $in: leadIds } }, { $set: { status: "in_progress" } });

        await outreachQ.addBulk(outreachJobs);
        
        // Wake up the Outreacher worker
        startOutreacherWorker();
    } else {
        console.log(`[Scheduler] No researched leads available for auto-sending.`);
    }

    // 5. Trigger Learner if we've crossed the 75-email threshold since last analysis
    const LEARNER_THRESHOLD = 75;
    const totalSent = campaign.stats?.emailsSent || 0;
    const lastTrigger = campaign.lastLearnerTriggerAt || 0;

    if (totalSent - lastTrigger >= LEARNER_THRESHOLD) {
        console.log(`[Scheduler] Triggering Learner for campaign ${campaignId} (sent: ${totalSent}, last trigger: ${lastTrigger})`);
        const learnerQ = getQueue("learner");
        await learnerQ.add("analyze", { campaignId });
        startLearnerWorker();

        // Update the threshold marker
        await Campaign.findByIdAndUpdate(campaignId, {
            $set: { lastLearnerTriggerAt: totalSent },
        });
    }

    // 6. Schedule the next day's run recursively
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 1); // Next day
    
    // Align with campaign sending hours if defined
    if (campaign.schedule?.schedule !== undefined) {
        nextRun.setHours(campaign.schedule.schedule, 0, 0, 0);
    }
    
    const jitteredNextRun = addJitterToDate(nextRun, 5); // up to 5 mins jitter

    // Update DB
    campaign.nextRunAt = jitteredNextRun;
    await campaign.save();

    // Enqueue the recursive delayed job
    const delay = Math.max(0, jitteredNextRun.getTime() - Date.now());
    const schedulerQ = getQueue("scheduler");
    await schedulerQ.add(
        "trigger-campaign",
        { campaignId },
        { delay }
    );
    
    console.log(`[Scheduler] Recursively scheduled next run for Campaign ${campaignId} at ${jitteredNextRun}`);
}, {
    connection: redisConnection as any,
    concurrency: 10, // Global dispatcher can handle many concurrently since it's lightweight
});

schedulerWorker.on("error", (err) => {
    console.error("[Scheduler Worker Error]", err);
});
