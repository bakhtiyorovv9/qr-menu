// src/config/imagekit.config.js
import ImageKit from "@imagekit/nodejs";
import { config } from "dotenv";
config();

const imagekit = new ImageKit({
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

export default imagekit;
