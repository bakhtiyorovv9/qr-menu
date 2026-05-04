import { config } from "dotenv";
import nodemailer from "nodemailer";

config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.GOOGLE_ACCOUNT_USER,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export default transporter;
