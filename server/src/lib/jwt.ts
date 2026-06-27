import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "./env";

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

export interface JwtPayload {
    userId: string;
}

// usage generateToken(userId) -> return token string
export const generateToken = (userId: mongoose.Types.ObjectId | string): string => {
    return jwt.sign(
        { userId: userId.toString() },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
    );
};

// usage verifyToken(token) -> return payload { userId } or null
export const verifyToken = (token: string): JwtPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as JwtPayload;
    } catch (error) {
        return null;
    }
};
