import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { Agency } from "../models/agency.model";
import type { IAgency } from "../models/agency.model";
import { sendError } from "../lib/responseHandler";

export interface AuthenticatedRequest extends Request {
    agency?: IAgency;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return sendError(res, "Not authorized to access this route", 401);
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return sendError(res, "Not authorized to access this route", 401);
        }

        const agency = await Agency.findById(decoded.userId);

        if (!agency) {
            return sendError(res, "Agency not found", 404);
        }

        req.agency = agency;
        next();
    } catch (error: any) {
        console.error("Auth middleware error:", error);
        sendError(res, error.message || "Internal Server Error", 500);
    }
};
