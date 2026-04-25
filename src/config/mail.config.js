import { config } from "dotenv";
import nodemailer from "nodemailer";

config();

const testAccount = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GOOGLE_ACCOUNT_USER,
        pass: process.env.GOOGLE_APP_PASSWORD,
    },
});
export default transporter;
