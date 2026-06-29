import dotenv from "dotenv";
dotenv.config();

import app from "./src/app";
import { connectDB } from "./src/lib/db";
import { initializeWorkers } from "./src/engine/workers";

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    console.log("Connected to DB");

    app.listen(PORT, async () => {
        console.log(`Server running on port ${PORT}`);
        await initializeWorkers();
    });
}).catch((error) => {
    console.error("Failed to connect to DB", error);
    process.exit(1);
});