import { Worker } from "bullmq";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createRedisConnection } from "../../lib/redis";
import { Agency } from "../../models/agency.model";
import { Outreach } from "../../models/outreach.model";
import { Lead } from "../../models/lead.model";
import { Campaign } from "../../models/campaign.model";
import replyGraph from "../agents/inbox_handler/graph";
import { env } from "../../lib/env";
import { getQueue } from "../queue";

/*
 Connects to the Agency's IMAP server, reads UNSEEN messages,
 matches them to an existing Outreach thread, and fires the Reply Agent.
 */
async function processInboundReplies() {
    console.log(`[InboxWorker] Checking for inbound replies...`);
    const agency = await Agency.findOne();
    if (!agency) {
        console.warn(`[InboxWorker] No agency found in database. Skipping.`);
        return;
    }

    const imapHost = env.IMAP_HOST;
    const imapPort = env.IMAP_PORT ? Number(env.IMAP_PORT) : 993;
    const imapUser = env.IMAP_USER || env.SMTP_USER;
    const imapPass = env.IMAP_PASS || env.SMTP_PASS;

    if (!imapHost || !imapUser || !imapPass) {
        console.warn(`[InboxWorker] No IMAP env config found (IMAP_HOST, IMAP_USER, IMAP_PASS). Skipping.`);
        return;
    }

    const client = new ImapFlow({
        host: imapHost,
        port: imapPort,
        secure: true,
        auth: {
            user: imapUser,
            pass: imapPass,
        },
        logger: false,
    });

    try {
        await client.connect();
        const lock = await client.getMailboxLock("INBOX");

        try {
            // Search for unread emails
            for await (const message of client.fetch({ seen: false }, { source: true, envelope: true })) {
                if (!message.source) continue;

                // Parse the raw email buffer
                const parsed = await simpleParser(message.source);
                const inReplyTo = parsed.inReplyTo || parsed.references?.[0];

                if (!inReplyTo) {
                    console.log(`[InboxWorker] Skipping non-threaded email: ${parsed.subject}`);
                    // Mark as seen so we don't process it again
                    await client.messageFlagsAdd(message.seq, ["\\Seen"]);
                    continue;
                }

                // Clean the Message-ID (often wrapped in < >)
                const cleanMessageId = inReplyTo.replace(/[<>]/g, "");

                // Find the original sent Outreach in our database
                const originalOutreach = await Outreach.findOne({ messageId: cleanMessageId });
                if (!originalOutreach) {
                    console.log(`[InboxWorker] Thread not found for Message-ID: ${cleanMessageId}`);
                    await client.messageFlagsAdd(message.seq, ["\\Seen"]);
                    continue;
                }

                console.log(`[InboxWorker] Found reply for Lead ${originalOutreach.leadId}`);

                const lead = await Lead.findById(originalOutreach.leadId);
                const campaign = await Campaign.findById(originalOutreach.campaignId);

                if (lead && campaign) {
                    // Update lead status
                    lead.status = "replied";
                    await lead.save();

                    // Increment Campaign replies stat
                    campaign.stats.replies += 1;
                    await campaign.save();

                    // Invoke the Reply Agent Graph
                    await replyGraph.invoke({
                        leadId: lead._id.toString(),
                        campaignId: campaign._id.toString(),
                        autoSend: agency.settings?.autoReplyEnabled ?? true,
                        inReplyTo: parsed.messageId ?? cleanMessageId,
                        replyText: parsed.text || "",
                        previousEmailText: originalOutreach.message.body || "",
                        company: {
                            name: lead.company.name,
                            industry: lead.company.industry,
                        },
                        contact: {
                            name: lead.contact.name,
                            email: lead.contact.email || "",
                        },
                        research: {
                            painPoints: lead.research.painPoints,
                            summary: lead.research.businessBrief || lead.research.summary,
                        },
                        agency: {
                            ownerName: agency.ownerName,
                            calendarLink: agency.calendarLink,
                            fromName: env.SMTP_FROM_NAME || agency.emailConfig?.fromName || agency.ownerName,
                            signature: agency.emailConfig?.signature,
                        },
                        strategyGuidelines: campaign.strategy?.reply || null,
                    });
                }

                // Mark the email as processed
                await client.messageFlagsAdd(message.seq, ["\\Seen"]);
            }
        } finally {
            lock.release();
        }
    } catch (err) {
        console.error(`[InboxWorker] IMAP Error:`, err);
    } finally {
        await client.logout();
    }
}


let inboxWorkerInstance: Worker | null = null;

export async function setupInboxHeartbeat() {
    // Create the worker lazily (only when this function is called after DB is connected)
    if (!inboxWorkerInstance) {
        const connection = createRedisConnection() as any;
        inboxWorkerInstance = new Worker(
            "inbox-Queue",
            async (job) => {
                console.log(`[InboxWorker] Heartbeat triggered at ${new Date().toISOString()}`);
                await processInboundReplies();
            },
            { connection }
        );

        inboxWorkerInstance.on("completed", (job) => {
            console.log(`[InboxWorker] Heartbeat complete`);
        });

        inboxWorkerInstance.on("failed", (job, err) => {
            console.error(`[InboxWorker] Heartbeat failed:`, err);
        });
    }

    const inboxQ = getQueue("inbox");
    await inboxQ.add("heartbeat", {}, {
        repeat: {
            pattern: "*/5 * * * *" // Every 5 minutes
        }
    });
    console.log("[InboxWorker] Heartbeat schedule registered");
}
