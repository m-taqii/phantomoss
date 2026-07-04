import express from "express";
import cors from "cors";
import { env } from "./lib/env";
import cookieParser from "cookie-parser";

import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";

import agencyRoutes from "./routes/agency.route";
import campaignRoutes from "./routes/campaign.route";
import authRoutes from "./routes/auth.route";
import leadsRoutes from "./routes/leads.route";
import outreachRoutes from "./routes/outreach.route";
import learningRoutes from "./routes/learning.route";

const app = express();

app.use(cookieParser());

// Core middleware
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/agency", agencyRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/outreach", outreachRoutes);
app.use("/api/learnings", learningRoutes);

app.use(errorHandler);

export default app;