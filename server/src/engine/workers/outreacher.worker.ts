import { Worker } from "bullmq";
import { createRedisConnection } from "../../lib/redis";
import outreacherGraph from "../agents/outreacher/graph";
import { GetQueueName } from "../queue";
import { Lead } from "../../models/lead.model";
import { Agency } from "../../models/agency.model";
import { Outreach } from "../../models/outreach.model";
import { env } from "../../lib/env";

const workersCache = new Map<string, Worker>();

// Starts or retrieves a cached BullMQ Worker for the Outreacher agent, scoped to the agency.
export function startOutreacherWorker(): Worker {
    const queueName = GetQueueName("outreach");

    if (!workersCache.has(queueName)) {
        const worker = new Worker(queueName, async (job) => {
            console.log(`[Outreacher Worker | ${queueName}] Processing job ${job.id}`);
            const { leadId, campaignId, autoSend, type = "initial" } = job.data;

            const lead = await Lead.findById(leadId);
            const agency = await Agency.findOne();

            if (!lead || !agency) {
                console.error(`[Outreacher Worker] Missing data for job ${job.id}`);
                return;
            }

            if (!lead.contact?.email) {
                console.error(`[Outreacher Worker] Lead ${leadId} has no email. Skipping outreach.`);
                return;
            }

            if (type !== "initial" && lead.status !== "contacted") {
                console.log(`[Outreacher Worker] Lead ${leadId} status is ${lead.status}. Dropping follow-up job.`);
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
        }, {
            connection: createRedisConnection() as any,
            concurrency: 5,
        });

        worker.on("error", (err) => {
            console.error(`[Outreacher Worker Error | ${queueName}]`, err);
        });

        worker.on("drained", async () => {
            console.log(`[Outreacher Worker | ${queueName}] Queue drained. Shutting down worker.`);
            await worker.close();
            workersCache.delete(queueName);
        });
        
        workersCache.set(queueName, worker);
    }
    
    return workersCache.get(queueName)!;
}