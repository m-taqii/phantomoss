import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN!;


if (!JWT_SECRET || !JWT_EXPIRES_IN) {
    throw new Error("JWT_SECRET or JWT_EXPIRES_IN is not defined");
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
