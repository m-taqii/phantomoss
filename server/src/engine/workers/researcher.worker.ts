import { Worker } from "bullmq";
import { createRedisConnection } from "../../lib/redis";
import researcherGraph from "../agents/researcher/graph";
import { GetQueueName, getQueue } from "../queue";
import { Lead } from "../../models/lead.model";
import { Campaign } from "../../models/campaign.model";
import { Agency } from "../../models/agency.model";

const workersCache = new Map<string, Worker>();

export function startResearcherWorker(): Worker {
  const queueName = GetQueueName("research");

  if (!workersCache.has(queueName)) {
    const worker = new Worker(queueName, async (job) => {
      console.log(`[Researcher Worker | ${queueName}] Processing job ${job.id}`);
      const { campaignId, leadId } = job.data;

      try {
        // 1. Fetch entities
        const lead = await Lead.findById(leadId);
        const campaign = await Campaign.findById(campaignId);
        const agency = await Agency.findOne();

        if (!lead || !campaign || !agency) {
          console.error(`[Researcher Worker] Missing data for job ${job.id}`);
          return;
        }

        // 2. Run the Researcher graph (scrape → contact → analyze)
        const finalState = await researcherGraph.invoke({
          campaignId,
          leadId,
          company: lead.company,
          contact: lead.contact,
          agencyContext: {
            services: agency.services,
            uniqueValue: agency.uniqueValue,
            caseStudies: agency.caseStudies,
          },
          strategyResearch: campaign.strategy?.research ?? null,
        });

        // 3. Determine outcome
        const score = finalState.score ?? 0;
        const disqualified = finalState.disqualified || score < 60 || !!finalState.error;

        if (disqualified) {
          // Mark as disqualified and stop — do not proceed to outreach
          await Lead.findByIdAndUpdate(leadId, {
            $set: {
              score,
              status: "disqualified",
              disqualifyReason: finalState.disqualifyReason || finalState.error || "Score below 60",
              "research.summary": finalState.research?.summary ?? "",
              "research.businessBrief": finalState.research?.businessBrief ?? "",
              "research.painPoints": finalState.research?.painPoints ?? [],
              "research.researchedAt": new Date(),
            },
          });
          console.log(`[Researcher Worker] Lead ${leadId} disqualified (score: ${score}).`);
        } else {
          // Good lead — save full research + update contact + mark as researched
          await Lead.findByIdAndUpdate(leadId, {
            $set: {
              score,
              status: "researched",
              research: {
                ...finalState.research,
                researchedAt: new Date(),
              },
              // Merge enriched contact info
              ...(finalState.contact?.email && { "contact.email": finalState.contact.email }),
              ...(finalState.contact?.name && { "contact.name": finalState.contact.name }),
              ...(finalState.contact?.title && { "contact.title": finalState.contact.title }),
              ...(finalState.contact?.phone && { "contact.phone": finalState.contact.phone }),
              ...(finalState.contact?.linkedin && { "contact.linkedin": finalState.contact.linkedin }),
              ...(finalState.contact?.emailSource && {
                "contact.emailSource": finalState.contact.emailSource,
                "contact.emailConfidence": finalState.contact.emailSource === "verified" ? 95
                  : finalState.contact.emailSource === "scraped" ? 70 : 30,
              }),
            },
          });

          // Update campaign stats
          await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { "stats.leadsResearched": 1 },
          });

          console.log(`[Researcher Worker] Lead ${leadId} researched. Score: ${score}`);
        }

        // 4. After every research job, check if the inventory needs a Hunter top-up.
        //    We check once per Researcher job completion (debounced by BullMQ concurrency).
        const dailyLimit = campaign.schedule?.dailyLimit ?? 30;
        const bufferTarget = dailyLimit * 3;
        const currentInventory = await Lead.countDocuments({
          campaignId,
          status: "researched",
        });

        if (currentInventory < dailyLimit) {
          // Below the TRIGGER threshold — wake up the Hunter
          const huntQueue = getQueue("hunt");
          const waitingHuntJobs = await huntQueue.getWaitingCount();
          if (waitingHuntJobs === 0) {
            await huntQueue.add("hunt", { campaignId });
            // Wake the hunter worker
            const { startHunterWorker } = await import("./hunter.worker");
            startHunterWorker();
            console.log(`[Researcher Worker] Inventory low (${currentInventory}/${bufferTarget}). Triggered Hunter.`);
          }
        } else if (currentInventory < bufferTarget) {
          console.log(`[Researcher Worker] Inventory at ${currentInventory}/${bufferTarget} — Hunter already scheduled or buffer filling.`);
        }

      } catch (err) {
        console.error(`[Researcher Worker Error]`, err);
        throw err;
      }
    }, {
      connection: createRedisConnection() as any,
      concurrency: 5,
    });

    worker.on("error", (err) => {
      console.error(`[Researcher Worker Error | ${queueName}]`, err);
    });

    worker.on("drained", async () => {
      console.log(`[Researcher Worker | ${queueName}] Queue drained. Shutting down.`);
      await worker.close();
      workersCache.delete(queueName);
    });

    workersCache.set(queueName, worker);
  }

  return workersCache.get(queueName)!;
}
