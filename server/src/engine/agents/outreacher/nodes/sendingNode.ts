import { OutreacherStateAnnotation } from "../state";
import { Outreach } from "../../../../models/outreach.model";
import { Lead } from "../../../../models/lead.model";
import { sendEmail } from "../../../../lib/email";
import { Campaign } from "../../../../models/campaign.model";
import { getQueue } from "../../../queue";

export default async function sendingNode(state: typeof OutreacherStateAnnotation.State) {
    if (!state.email || !state.leadId || !state.campaignId) {
        return;
    }

    if(!state.contact.email) {
        await Outreach.create({
            campaignId: state.campaignId,
            leadId: state.leadId,
            channel: "email",
            type: state.outreachType,
            status: "failed",
            error: "Missing contact email configuration",
            message: {
                subject: state.email.subject,
                body: state.email.body,
                generatedAt: new Date(),
            }
        });
        return;
    }

    try {
        const info = await sendEmail({
            to: state.contact.email,
            subject: state.email.subject,
            text: state.email.body,
            inReplyTo: state.inReplyTo || undefined,
            references: state.inReplyTo || undefined,
        });

        // Save as sent in the database
        await Outreach.create({
            campaignId: state.campaignId,
            leadId: state.leadId,
            channel: "email",
            type: state.outreachType,
            status: "sent",
            messageId: info.messageId,
            threadId: state.inReplyTo || undefined,
            message: {
                subject: state.email.subject,
                body: state.email.body,
                generatedAt: new Date(),
            },
            sentAt: new Date()
        });

        // Update lead status
        await Lead.findByIdAndUpdate(state.leadId, { 
            status: state.outreachType === "initial" ? "contacted" : "followed_up", 
            lastContactedAt: new Date(),
            $inc: { followUpCount: 1 }
        });
        
        // Update campaign stats
        await Campaign.findByIdAndUpdate(state.campaignId, {
            $inc: { "stats.emailsSent": 1 }
        });
        
        console.log(`[SendingNode] Successfully sent ${state.outreachType} outreach for lead ${state.leadId}`);

        // Schedule the next follow-up if applicable
        const campaign = await Campaign.findById(state.campaignId);
        if (campaign?.schedule?.followUpDays) {
            let nextFollowUpDays = null;
            let nextFollowUpType = null;

            if (state.outreachType === "initial" && campaign.schedule.followUpDays.length > 0) {
                nextFollowUpDays = campaign.schedule.followUpDays[0];
                nextFollowUpType = "followup_1";
            } else if (state.outreachType === "followup_1" && campaign.schedule.followUpDays.length > 1) {
                nextFollowUpDays = campaign.schedule.followUpDays[1];
                nextFollowUpType = "followup_2";
            }

            if (nextFollowUpDays !== null && nextFollowUpDays !== undefined && nextFollowUpType) {
                const delayMs = nextFollowUpDays * 24 * 60 * 60 * 1000;
                const outreachQ = getQueue("outreach");
                
                await outreachQ.add("followup", {
                    leadId: state.leadId,
                    campaignId: state.campaignId,
                    type: nextFollowUpType
                }, {
                    delay: delayMs
                });
                
                console.log(`[SendingNode] Scheduled ${nextFollowUpType} for lead ${state.leadId} in ${nextFollowUpDays} days`);
            }
        }
    } catch (err: any) {
        console.error(`[SendingNode] Failed to send email for lead ${state.leadId}:`, err);
        
        // Save as failed in the database
        await Outreach.create({
            campaignId: state.campaignId,
            leadId: state.leadId,
            channel: "email",
            type: state.outreachType,
            status: "failed",
            error: err.message,
            message: {
                subject: state.email.subject,
                body: state.email.body,
                generatedAt: new Date(),
            }
        });
    }
}