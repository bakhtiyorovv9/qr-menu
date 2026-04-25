import { config } from "dotenv";
import mongoose from "mongoose";

config({ quiet: true });

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
    console.error("MONGO URL not given");
    process.exit(1);
}

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        return `Connected to DB`;
    } catch (err) {
        console.log(err);
        console.log(`DB Connection error`);
    }
};
