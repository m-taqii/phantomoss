import mongoose, { Schema, Document } from "mongoose";
import type { OutreachChannel } from "./campaign.model";

export type OutreachType = "initial" | "followup_1" | "followup_2" | "reply" | "proposal";
export type OutreachStatus = "draft" | "scheduled" | "sent" | "delivered" | "bounced" | "failed";
export type ReplyIntent = "interested" | "not_interested" | "has_questions" | "wants_call" | "out_of_office" | "unknown";

export interface IOutreach extends Document {
  campaignId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;

  channel: OutreachChannel;
  type: OutreachType;
  status: OutreachStatus;

  // The actual message
  message: {
    subject?: string;            // email only
    body: string;
    generatedAt: Date;
  };

  // Sending metadata
  sentAt?: Date;
  scheduledFor?: Date;
  messageId?: string;            // SMTP message ID / platform ID
  threadId?: string;             // for email threading

  // Reply tracking
  reply?: {
    receivedAt: Date;
    body: string;
    intent: ReplyIntent;
    intentConfidence: number;    // 0-100
    draftResponse?: string;      // AI-drafted reply
    humanReviewed: boolean;
    respondedAt?: Date;
  };

  // Next action scheduled by Reply Handler
  nextAction?: {
    type: "send_followup" | "book_call" | "send_proposal" | "mark_closed" | "human_review";
    scheduledFor?: Date;
    done: boolean;
  };

  error?: string;                // if sending failed

  createdAt: Date;
  updatedAt: Date;
}

const OutreachSchema = new Schema<IOutreach>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },

    channel: {
      type: String,
      enum: ["email", "whatsapp", "linkedin", "instagram"],
      required: true,
    },

    type: {
      type: String,
      enum: ["initial", "followup_1", "followup_2", "reply", "proposal"],
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "delivered", "bounced", "failed"],
      default: "draft",
      index: true,
    },

    message: {
      subject: { type: String },
      body: { type: String, required: true },
      generatedAt: { type: Date, default: Date.now },
    },

    sentAt: { type: Date },
    scheduledFor: { type: Date, index: true },
    messageId: { type: String },
    threadId: { type: String },

    reply: {
      receivedAt: { type: Date },
      body: { type: String },
      intent: {
        type: String,
        enum: ["interested", "not_interested", "has_questions", "wants_call", "out_of_office", "unknown"],
      },
      intentConfidence: { type: Number, min: 0, max: 100 },
      draftResponse: { type: String },
      humanReviewed: { type: Boolean, default: false },
      respondedAt: { type: Date },
    },

    nextAction: {
      type: {
        type: String,
        enum: ["send_followup", "book_call", "send_proposal", "mark_closed", "human_review"],
      },
      scheduledFor: { type: Date },
      done: { type: Boolean, default: false },
    },

    error: { type: String },
  },
  { timestamps: true }
);

OutreachSchema.index({ status: 1 });
OutreachSchema.index({ leadId: 1, type: 1 });
OutreachSchema.index({ scheduledFor: 1, status: 1 }); // for cron job queries
OutreachSchema.index({ "nextAction.done": 1, "nextAction.scheduledFor": 1 });

export const Outreach = mongoose.model<IOutreach>("Outreach", OutreachSchema);