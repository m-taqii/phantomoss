import dotenv from "dotenv";
dotenv.config();

import app from "./src/app";
import { connectDB } from "./src/lib/db";
import "./src/engine/workers"; // Initializes the global scheduler worker

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    console.log("Connected to DB");

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to DB", error);
    process.exit(1);
});