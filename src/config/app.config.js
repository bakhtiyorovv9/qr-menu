import { config } from "dotenv";

config({ quiet: true });

export default {
    APP_PORT: process.env.APP_PORT ? Number(process.env.APP_PORT) : 3000,
};
