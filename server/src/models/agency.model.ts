import mongoose from "mongoose";
import { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAgency extends Document {
    email: string;
    ownerName: string;
    agencyName: string;
    agencyDescription: string;
    website: string;
    services: string[];
    targetIndustries: string[];
    uniqueValue: string;
    caseStudies: string[];
    calendarLink?: string;
    
    emailConfig: {
        fromName: string;
        fromAddress: string;
        imapHost?: string;
        imapPort?: number;
        imapUser?: string;
        imapPass?: string;
        signature?: string;
    };

    settings: {
        timezone: string;
        autoReplyEnabled?: boolean;
    };

    password?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const AgencySchema = new Schema<IAgency>(
    {
        ownerName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        agencyName: { type: String, required: true, trim: true},
        services: {type: [String], default: []},
        agencyDescription:{type: String, trim: true},
        website: { type: String, required: true, trim: true },

        // Global Agency Profile
        targetIndustries: [{ type: String, default: [] }],
        uniqueValue: { type: String, default: "" },
        caseStudies: [{ type: String, default: [] }],
        calendarLink: { type: String, default: "" },

        // Default Email Config
        emailConfig: {
            fromName: { type: String },
            fromAddress: { type: String },
            imapHost: { type: String },
            imapPort: { type: Number },
            imapUser: { type: String },
            imapPass: { type: String },
            signature: { type: String },
        },

        settings: {
            timezone: { type: String, default: "UTC" },
            autoReplyEnabled: { type: Boolean, default: true },
        },

        password: { type: String, required: true, trim: true, select: false },
    },
    { timestamps: true }
);

AgencySchema.pre<IAgency>("save", async function () {
    if (!this.isModified("password") || !this.password) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error: any) {
        throw error;
    }
});

AgencySchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export const Agency = mongoose.model<IAgency>("Agency", AgencySchema);