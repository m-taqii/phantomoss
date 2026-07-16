import { Worker } from "bullmq";
import { createRedisConnection } from "../../lib/redis";
import outreacherGraph from "../agents/outreacher/graph";
import { GetQueueName } from "../queue";
import { Lead } from "../../models/lead.model";
import { Agency } from "../../models/agency.model";
import { Outreach } from "../../models/outreach.model";
import { env } from "../../lib/env";

const workersCache = new Map<string, Worker>();

export async function processOutreachJob(data: any) {
    const { leadId, campaignId, autoSend, type = "initial" } = data;

    const lead = await Lead.findById(leadId);
    const agency = await Agency.findOne();

    if (!lead || !agency) {
        console.error(`[Outreacher] Missing data for job targeting lead ${leadId}`);
        return;
    }

    if (!lead.contact?.email) {
        console.error(`[Outreacher] Lead ${leadId} has no email. Skipping outreach.`);
        return;
    }

    if (type !== "initial" && lead.status !== "contacted") {
        console.log(`[Outreacher] Lead ${leadId} status is ${lead.status}. Dropping follow-up job.`);
        return;
    }

    let inReplyTo = null;
    let previousMessageBody = null;

    if (type !== "initial") {
        const lastOutreach = await Outreach.findOne({ leadId, campaignId, status: "sent" }).sort({ createdAt: -1 });
        if (lastOutreach) {
            inReplyTo = lastOutreach.messageId;
            previousMessageBody = lastOutreach.message?.body || null;
        }
    }

    await outreacherGraph.invoke({
        leadId,
        campaignId,
        autoSend,
        outreachType: type,
        inReplyTo,
        previousMessageBody,
        company: lead.company,
        contact: {
            name: lead.contact.name,
            title: lead.contact.title,
            email: lead.contact.email,
        },
        research: lead.research,
        agency: {
            name: agency.agencyName || agency.ownerName,
            ownerName: agency.ownerName,
            agencyName: agency.agencyName,
            email: agency.email,
            services: agency.services,
            uniqueValue: agency.uniqueValue,
            caseStudies: agency.caseStudies,
            calendarLink: agency.calendarLink,
            fromEmail: env.SMTP_FROM_ADDRESS || env.SMTP_USER || agency.emailConfig?.fromAddress || agency.email,
            fromName: env.SMTP_FROM_NAME || agency.emailConfig?.fromName || agency.ownerName || agency.agencyName,
            signature: agency.emailConfig?.signature,
            emailConfig: agency.emailConfig,
        }
    });
}

// Starts or retrieves a cached BullMQ Worker for the Outreacher agent, scoped to the agency.
export function startOutreacherWorker(): Worker {
    const queueName = GetQueueName("outreach");

    if (!workersCache.has(queueName)) {
        const worker = new Worker(queueName, async (job) => {
            console.log(`[Outreacher Worker | ${queueName}] Processing job ${job.id}`);
            await processOutreachJob(job.data);
        }, {
            connection: createRedisConnection() as any,
            concurrency: 5,
        });

        worker.on("error", (err) => {
            console.error(`[Outreacher Worker Error | ${queueName}]`, err);
        });

        let drainTimeout: NodeJS.Timeout | null = null;

        worker.on("active", () => {
            if (drainTimeout) {
                clearTimeout(drainTimeout);
                drainTimeout = null;
            }
        });

        worker.on("drained", async () => {
            console.log(`[Outreacher Worker | ${queueName}] Queue drained. Waiting 35s for stalled jobs before shutdown...`);
            if (drainTimeout) clearTimeout(drainTimeout);
            drainTimeout = setTimeout(async () => {
                console.log(`[Outreacher Worker | ${queueName}] Shutdown timeout reached. Shutting down.`);
                await worker.close();
                workersCache.delete(queueName);
            }, 35000);
        });
        
        workersCache.set(queueName, worker);
    }
    
    return workersCache.get(queueName)!;
}