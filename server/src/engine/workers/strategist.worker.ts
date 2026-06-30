import { Worker } from "bullmq";
import { createRedisConnection } from "../../lib/redis";
import strategistGraph from "../agents/strategist/graph";
import { GetQueueName, getQueue } from "../queue";
import { Campaign } from "../../models/campaign.model";
import { Agency } from "../../models/agency.model";

const workersCache = new Map<string, Worker>();

// Starts or retrieves a cached BullMQ Worker for the Strategist agent, scoped to the agency.
export function startStrategistWorker(): Worker {
    const queueName = GetQueueName("strategy");

    if (!workersCache.has(queueName)) {
        const worker = new Worker(queueName, async (job) => {
            console.log(`[Strategist Worker | ${queueName}] Processing job ${job.id}`);
            const { campaignId, learnings = [], isRefinement = false } = job.data;

            try {
                const campaign = await Campaign.findById(campaignId);
                const agency = await Agency.findOne();

                if (!campaign || !agency) {
                    console.error(`[Strategist Worker] Campaign ${campaignId} or Agency not found.`);
                    return;
                }

                const stateInput = {
                    campaignId,
                    agency: {
                        name: agency.agencyName,
                        description: agency.agencyDescription || "",
                        services: agency.services || [],
                        targetIndustries: agency.targetIndustries || [],
                        uniqueValue: agency.uniqueValue || "",
                        caseStudies: agency.caseStudies || [],
                        calendarLink: agency.calendarLink || "",
                    },
                    campaign: {
                        name: campaign.name,
                        channel: campaign.channel,
                        target: campaign.target,
                        schedule: {
                            dailyLimit: campaign.schedule.dailyLimit,
                            sendingHours: {
                                start: campaign.schedule.schedule,
                                end: campaign.schedule.schedule + 8
                            },
                            followUpDays: campaign.schedule.followUpDays,
                            warmupMode: campaign.schedule.warmupMode,
                        },
                    },
                    instructions: campaign.instructions || null,
                    learnings,
                    previousStrategy: isRefinement && campaign.strategy
                        ? JSON.parse(JSON.stringify(campaign.strategy))
                        : null,
                };

                console.log(`[Strategist Worker] Invoking strategist graph for campaign ${campaignId}${isRefinement ? " (refinement)" : ""}...`);
                const finalState = await strategistGraph.invoke(stateInput);

                if (finalState.error || !finalState.strategy) {
                    console.error(`[Strategist Worker] Graph error for campaign ${campaignId}:`, finalState.error);
                    return; 
                }

                campaign.strategy = finalState.strategy as any;
                await campaign.save();
                console.log(`[Strategist Worker] Strategy saved successfully for campaign ${campaignId}.`);

                // Enqueue the scheduler job to actually start the campaign (Hunter, etc.)
                const schedulerQ = getQueue("scheduler");
                const now = new Date();
                const tz = agency?.settings?.timezone || "UTC";
                const { toZonedTime, fromZonedTime } = await import("date-fns-tz");
                
                const nowInTz = toZonedTime(now, tz);
                const startInTz = toZonedTime(campaign.schedule.startDate || now, tz);
                
                // Align to the configured hour
                if (campaign.schedule?.schedule !== undefined) {
                    startInTz.setHours(campaign.schedule.schedule, 0, 0, 0);
                }
                
                // If that specific hour has already passed for today, run tomorrow instead
                if (startInTz.getTime() <= nowInTz.getTime()) {
                    startInTz.setDate(startInTz.getDate() + 1);
                }
                
                const nextRunUTC = fromZonedTime(startInTz, tz);
                const delay = Math.max(0, nextRunUTC.getTime() - now.getTime());

                await schedulerQ.add(
                    "trigger-campaign",
                    { campaignId: campaign._id.toString() },
                    {
                        delay, 
                        jobId: `scheduler-${campaign._id.toString()}`
                    }
                );

                // Wake up the scheduler worker to process the job
                const { startSchedulerWorker } = await import("./scheduler.worker");
                startSchedulerWorker();

                console.log(`[Strategist Worker] Campaign ${campaignId} scheduled in scheduler queue with delay ${delay}ms.`);

            } catch (err) {
                console.error(`[Strategist Worker Error]`, err);
                throw err;
            }
        }, {
            connection: createRedisConnection() as any,
            concurrency: 2,
        });

        worker.on("error", (err) => {
            console.error(`[Strategist Worker Error | ${queueName}]`, err);
        });

        worker.on("drained", async () => {
            console.log(`[Strategist Worker | ${queueName}] Queue drained. Shutting down worker to save resources.`);
            await worker.close();
            workersCache.delete(queueName);
        });
        
        workersCache.set(queueName, worker);
    }
    
    return workersCache.get(queueName)!;
}
