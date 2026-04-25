import { config } from "dotenv";
import signed from "signed";

config();

const signature = signed.default({
    secret: process.env.SIGN_URL_SECRET,
});

export default signature;
