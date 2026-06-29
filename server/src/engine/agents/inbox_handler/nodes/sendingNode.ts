import { ReplyStateAnnotation } from "../state";
import { Outreach } from "../../../../models/outreach.model";
import { Lead } from "../../../../models/lead.model";
import { sendEmail } from "../../../../lib/email";

export default async function sendingNode(state: typeof ReplyStateAnnotation.State): Promise<Partial<typeof ReplyStateAnnotation.State>> {
  if (!state.draftReply || !state.leadId || !state.campaignId || !state.contact.email) {
    return {};
  }

  try {
    const info = await sendEmail({
      to: state.contact.email,
      subject: state.draftReply.subject,
      text: state.draftReply.body,
      inReplyTo: state.inReplyTo,
      references: state.inReplyTo,
    });

    await Outreach.create({
      campaignId: state.campaignId,
      leadId: state.leadId,
      channel: "email",
      type: "reply",
      status: "sent",
      messageId: info.messageId,
      threadId: state.inReplyTo,
      message: {
        subject: state.draftReply.subject,
        body: state.draftReply.body,
        generatedAt: new Date(),
      },
      sentAt: new Date(),
    });

    // Update the Lead to reflect the recent interaction
    await Lead.findByIdAndUpdate(state.leadId, {
      $set: { 
        status: "replied",
        lastContactedAt: new Date() 
      }
    });

    // Update Campaign stats
    const { Campaign } = await import("../../../../models/campaign.model");
    await Campaign.findByIdAndUpdate(state.campaignId, {
      $inc: { "stats.emailsSent": 1 }
    });

    console.log(`[ReplyAgent] Auto-reply sent to ${state.contact.email}`);
    return {};
  } catch (err: any) {
    console.error(`[ReplyAgent] Failed to auto-send reply:`, err);
    return { error: err.message };
  }
}
