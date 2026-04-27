// src/helpers/cloudinary.helper.js
import cloudinary from "../config/cloudinary.config.js";
import { Readable } from "node:stream";

/**
 * Rasmni Cloudinary ga yuklash
 * @param {Buffer} fileBuffer    - req.file.buffer
 * @param {string} folder        - "categories" | "products" | "feedbacks"
 * @returns {Promise<string>}    - Yuklangan rasm URL si
 */
export const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `mossmenu/${folder}`,
                resource_type: "image",
                transformation: [{ quality: "auto", fetch_format: "auto" }],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            },
        );

        // Buffer → Stream ga o'tkazish
        const readable = new Readable();
        readable.push(fileBuffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
};

/**
 * Rasmni Cloudinary dan o'chirish
 * @param {string} imageUrl - DB dagi rasm URL si
 */
export const deleteFromCloudinary = async (imageUrl) => {
    if (!imageUrl) return;
    if (!imageUrl.includes("cloudinary.com")) return;

    try {
        // URL dan public_id ni olish
        // Misol URL: https://res.cloudinary.com/demo/image/upload/v1234/mossmenu/categories/abc123.jpg
        // public_id = mossmenu/categories/abc123
        const urlParts = imageUrl.split("/upload/")[1]; // v1234/mossmenu/categories/abc123.jpg
        const publicId = urlParts
            .replace(/^v\d+\//, "") // v1234/ ni olib tashlash
            .replace(/\.[^.]+$/, ""); // .jpg kengaytmasini olib tashlash

        await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary dan o'chirildi:", publicId);
    } catch (e) {
        console.warn("Cloudinary o'chirishda xato:", e.message);
    }
};
