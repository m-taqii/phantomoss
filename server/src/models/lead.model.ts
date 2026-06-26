import mongoose, { Schema, Document } from "mongoose";

export type LeadStatus =
  | "discovered"    // Hunter found it
  | "researched"    // Researcher enriched it
  | "approved"      // human approved for outreach
  | "queued"        // in sending queue
  | "contacted"     // first email sent
  | "followed_up"   // follow-up sent
  | "replied"       // they replied
  | "call_booked"   // call scheduled
  | "proposal_sent" // proposal delivered
  | "converted"     // became a client
  | "not_interested"
  | "bounced"
  | "unsubscribed";

export interface ILead extends Document {
  campaignId: mongoose.Types.ObjectId;

  // Basic identity
  company: {
    name: string;
    website: string;
    domain: string;
    industry: string;
    location: string;
    size?: string;
    description?: string;
    foundedYear?: number;
    socialLinks: {
      linkedin?: string;
      instagram?: string;
      facebook?: string;
      twitter?: string;
    };
  };

  // Contact
  contact: {
    name?: string;
    title?: string;
    email?: string;
    emailConfidence: number;     // 0-100, how confident we are the email is valid
    emailSource: "scraped" | "guessed" | "verified" | "manual" | "corrected";
    phone?: string;
    linkedin?: string;
    whatsapp?: string;
    instagram?: string;
    phoneSource?: string;
  };

  // Researcher output — the intelligence that makes outreach personal
  research: {
    painPoints: string[];        // identified problems we can solve
    recentActivity: string[];    // recent news, posts, launches
    techStack: string[];         // tools they use, signals for pitch angle
    competitors: string[];
    summary: string;             // 2-3 sentence brief for the Outreach agent
    researchedAt?: Date;
  };

  // Outreach tracking
  status: LeadStatus;
  source: "google_maps" | "google_search" | "ddg_search" | "directory" | "manual";
  score: number;                 // 0-100, set by Researcher based on fit
  lastContactedAt?: Date;
  followUpCount: number;

  // Human review
  humanApproved: boolean;
  humanNotes?: string;

  // Dedup
  fingerprint: string;           // hash of domain — prevents duplicate leads

  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },

    company: {
      name: { type: String, required: true },
      website: { type: String, required: true },
      domain: { type: String, required: true },
      industry: { type: String, required: true },
      location: { type: String, default: "" },
      size: { type: String },
      description: { type: String },
      foundedYear: { type: Number },
      socialLinks: {
        linkedin: { type: String },
        instagram: { type: String },
        facebook: { type: String },
        twitter: { type: String },
      },
    },

    contact: {
      name: { type: String },
      title: { type: String },
      email: { type: String, lowercase: true, trim: true },
      emailConfidence: { type: Number, default: 0, min: 0, max: 100 },
      emailSource: {
        type: String,
        enum: ["scraped", "guessed", "verified", "manual", "corrected"],
        default: "guessed",
      },
      phone: { type: String },
      linkedin: { type: String },
      whatsapp: { type: String },
      instagram: { type: String },
    },

    research: {
      painPoints: [{ type: String }],
      recentActivity: [{ type: String }],
      techStack: [{ type: String }],
      competitors: [{ type: String }],
      summary: { type: String, default: "" },
      researchedAt: { type: Date },
    },

    status: {
      type: String,
      enum: [
        "discovered", "researched", "approved", "queued",
        "contacted", "followed_up", "replied", "call_booked",
        "proposal_sent", "converted", "not_interested", "bounced", "unsubscribed",
      ],
      default: "discovered",
      index: true,
    },

    source: {
      type: String,
      enum: ["google_maps", "google_search", "ddg_search", "directory", "manual"],
      required: true,
    },

    score: { type: Number, default: 0, min: 0, max: 100 },
    lastContactedAt: { type: Date, index: true },
    followUpCount: { type: Number, default: 0 },
    humanApproved: { type: Boolean, default: false },
    humanNotes: { type: String },
    fingerprint: { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent duplicate leads
LeadSchema.index({ fingerprint: 1 }, { unique: true });
LeadSchema.index({ status: 1 });
LeadSchema.index({ campaignId: 1, status: 1 });
LeadSchema.index({ "contact.email": 1 });

export const Lead = mongoose.model<ILead>("Lead", LeadSchema);