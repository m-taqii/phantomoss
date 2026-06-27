import { Worker } from "bullmq";
import { redisConnection } from "../../lib/redis";
import hunterGraph from "../agents/Hunter/graph";
import { GetQueueName } from "../queue";
import { Lead } from "../../models/lead.model";

const workersCache = new Map<string, Worker>();

export function startHunterWorker(): Worker {
  const queueName = GetQueueName("hunt");

  if (!workersCache.has(queueName)) {
    const worker = new Worker(queueName, async (job) => {
      console.log(`[Hunter Worker | ${queueName}] Processing job ${job.id}`);
      const { campaignId } = job.data;

      try {
        const { Campaign } = await import("../../models/campaign.model");
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
          console.error(`[Hunter Worker] Campaign ${campaignId} not found.`);
          return;
        }

        const dailyLimit = campaign.schedule?.dailyLimit ?? 30;
        const bufferTarget = dailyLimit * 3; // e.g. 90 leads

        // Count how many `researched` leads are already in the inventory
        const currentInventory = await Lead.countDocuments({
          campaignId,
          status: "researched",
        });

        const needed = bufferTarget - currentInventory;

        if (needed <= 0) {
          console.log(`[Hunter Worker] Buffer is full (${currentInventory}/${bufferTarget}). Nothing to hunt.`);
          return;
        }

        console.log(`[Hunter Worker] Inventory: ${currentInventory}/${bufferTarget}. Hunting ${needed} more leads.`);

        await hunterGraph.invoke({
          campaignId,
          target: campaign.target,
          strategy: campaign.strategy ?? null,
          targetCount: needed,
          // Resume from where we left off
          currentRegionIndex: campaign.hunterState?.currentRegionIndex ?? 0,
          currentQuery: campaign.hunterState?.currentQuery,
          currentOffset: campaign.hunterState?.currentOffset ?? 0,
          exhaustedRegions: campaign.hunterState?.exhaustedRegions ?? [],
        });

      } catch (err) {
        console.error(`[Hunter Worker Error | ${queueName}]`, err);
        throw err;
      }
    }, {
      connection: redisConnection as any,
      concurrency: 2,
    });

    worker.on("error", (err) => {
      console.error(`[Hunter Worker Error | ${queueName}]`, err);
    });

    worker.on("drained", async () => {
      console.log(`[Hunter Worker | ${queueName}] Queue drained. Shutting down.`);
      await worker.close();
      workersCache.delete(queueName);
    });

    workersCache.set(queueName, worker);
  }

  return workersCache.get(queueName)!;
}