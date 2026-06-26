import { generateToken } from "../lib/jwt";
import { Agency } from "../models/agency.model";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendError } from "../lib/responseHandler";

// @desc Register a new agency
// @route POST /api/auth/register
// @access Public
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ownerName, agencyName, agencyDescription, services, email, password, website } = req.body;

        if (!ownerName || !agencyName || !email || !password || !website) {
            sendError(res, "Please provide ownerName, agencyName, email, password, and website", 400);
            return;
        }

        const existingAgencyCount = await Agency.countDocuments();
        if (existingAgencyCount > 0) {
            sendError(res, "An account is already registered on this instance. New registrations are disabled.", 403);
            return;
        }

        const agency = new Agency({
            ownerName,
            agencyName,
            agencyDescription: agencyDescription || "",
            services: services || [],
            email,
            password,
            website,
            // Initialize new global fields with defaults or registration data
            emailConfig: {
                fromName: ownerName,
                fromAddress: email,
            },
            targetIndustries: [],
            uniqueValue: "",
            caseStudies: [],
        });
        await agency.save();

        const token = generateToken(agency._id as any);
        res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 7 }); // 1 week

        sendSuccess(res, {
            agency: {
                _id: agency._id,
                ownerName: agency.ownerName,
                agencyName: agency.agencyName,
                email: agency.email,
                website: agency.website,
            }
        }, "Agency registered successfully", 201);
    } catch (error: any) {
        console.error("Register error:", error);
        sendError(res, error.message || "Server Error", 500);
    }
};

// @desc Login an agency
// @route POST /api/auth/login
// @access Public
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            sendError(res, "Please provide email and password", 400);
            return;
        }

        const agency = await Agency.findOne({ email }).select("+password");

        if (!agency) {
            sendError(res, "Invalid credentials", 401);
            return;
        }

        const isMatch = await agency.comparePassword(password);

        if (!isMatch) {
            sendError(res, "Invalid credentials", 401);
            return;
        }

        const token = generateToken(agency._id as any);
        res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 7 }); // 1 week

        sendSuccess(res, {
            agency: {
                _id: agency._id,
                ownerName: agency.ownerName,
                agencyName: agency.agencyName,
                email: agency.email,
                website: agency.website,
            },
        }, "Logged in successfully", 200);

    } catch (error: any) {
        console.error("Login error:", error);
        sendError(res, error.message || "Server Error", 500);
    }
};

// @desc Get current logged-in agency
// @route GET /api/auth/me
// @access Private
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        sendSuccess(res, { agency: req.agency }, "Agency fetched successfully", 200);
    } catch (error: any) {
        sendError(res, error.message || "Server Error", 500);
    }
};
