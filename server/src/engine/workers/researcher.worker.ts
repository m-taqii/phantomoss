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

        // 4. After every research job, evaluate stock using the centralized manager.
        // This correctly accounts for "discovered" leads in the pipeline and prevents infinite Hunter loops!
        const { evaluateLeadStock } = await import("./stock");
        await evaluateLeadStock(campaignId);

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

    let drainTimeout: NodeJS.Timeout | null = null;

    worker.on("active", () => {
      if (drainTimeout) {
        clearTimeout(drainTimeout);
        drainTimeout = null;
      }
    });

    worker.on("drained", async () => {
      console.log(`[Researcher Worker | ${queueName}] Queue drained. Waiting 35s for stalled jobs before shutdown...`);
      if (drainTimeout) clearTimeout(drainTimeout);
      drainTimeout = setTimeout(async () => {
        console.log(`[Researcher Worker | ${queueName}] Shutdown timeout reached. Shutting down.`);
        await worker.close();
        workersCache.delete(queueName);
      }, 35000);
    });

    workersCache.set(queueName, worker);
  }

  return workersCache.get(queueName)!;
}
