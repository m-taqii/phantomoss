import mongoose from "mongoose";
import { env } from "./env";
export const connectDB = async () => {
    try {
        if (!env.MONGODB_URI) {
            throw new Error("Please provide MONGODB_URI");
        }

        if (mongoose.connection.readyState === 1) {
            console.log("Already connected to DB");
            return;
        }

        console.log("Connecting to DB...");

        await mongoose.connect(env.MONGODB_URI);

        console.log("DB connected");
    } catch (error) {
        console.error("Failed to connect to DB", error);
        process.exit(1);
    }
};