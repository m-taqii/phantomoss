import mongoose, { Schema, Document } from "mongoose";

export interface ILearning extends Document {
  campaignId: mongoose.Types.ObjectId;

  // Raw aggregated metrics at the time of analysis
  metrics: {
    totalSent: number;
    totalReplied: number;
    totalBounced: number;
    totalNotInterested: number;
    totalInterested: number;
    totalQuestionsAsked: number;
    replyRate: number;
    positiveRate: number;
  };

  // Structured insights extracted by the Learner LLM
  insights: {
    workingAngles: string[];
    failingAngles: string[];
    commonObjections: string[];
    successfulRebuttals: string[];
    icpRefinements: string[];
  };

  // Sample reply/outreach pairs for the Strategist to review
  sampleReplies: Array<{
    intent: string;
    replySnippet: string;
    ourEmailSnippet: string;
  }>;

  // Snapshot of the strategy that was active when this learning was generated
  previousStrategy: Record<string, any> | null;

  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LearningSchema = new Schema<ILearning>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },

    metrics: {
      totalSent: { type: Number, default: 0 },
      totalReplied: { type: Number, default: 0 },
      totalBounced: { type: Number, default: 0 },
      totalNotInterested: { type: Number, default: 0 },
      totalInterested: { type: Number, default: 0 },
      totalQuestionsAsked: { type: Number, default: 0 },
      replyRate: { type: Number, default: 0 },
      positiveRate: { type: Number, default: 0 },
    },

    insights: {
      workingAngles: [{ type: String }],
      failingAngles: [{ type: String }],
      commonObjections: [{ type: String }],
      successfulRebuttals: [{ type: String }],
      icpRefinements: [{ type: String }],
    },

    sampleReplies: [
      {
        intent: { type: String },
        replySnippet: { type: String },
        ourEmailSnippet: { type: String },
      },
    ],

    previousStrategy: { type: Schema.Types.Mixed, default: null },

    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LearningSchema.index({ campaignId: 1, generatedAt: -1 });

export const Learning = mongoose.model<ILearning>("Learning", LearningSchema);
