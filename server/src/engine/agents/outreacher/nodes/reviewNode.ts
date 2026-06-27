import { OutreacherStateAnnotation } from "../state";
import { Outreach } from "../../../../models/outreach.model";
import { Lead } from "../../../../models/lead.model";

export default async function reviewNode(state: typeof OutreacherStateAnnotation.State) {
  if (state.email && state.leadId && state.campaignId) {
    // Save as draft in the database
    await Outreach.create({
      campaignId: state.campaignId,
      leadId: state.leadId,
      channel: "email",
      type: "initial",
      status: "draft",
      message: {
        subject: state.email.subject,
        body: state.email.body,
        generatedAt: new Date(),
      }
    });

    // Update lead status
    await Lead.findByIdAndUpdate(state.leadId, { status: "queued" });
    
    console.log(`[ReviewNode] Saved drafted outreach for lead ${state.leadId}`);
  }

  return {
    autoSend: false,
  };
}