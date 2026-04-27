// src/helpers/imagekit.helper.js
import imagekit from "../config/imagekit.config.js";

/**
 * Rasmni ImageKit ga yuklash
 * @param {Buffer} fileBuffer    - req.file.buffer
 * @param {string} originalName  - req.file.originalname
 * @param {string} folder        - "categories" | "products" | "feedbacks"
 * @returns {Promise<string>}    - Yuklangan rasm URL si
 */
export const uploadToImageKit = async (fileBuffer, originalName, folder) => {
    const result = await imagekit.files.upload({
        file: fileBuffer,
        fileName: `${Date.now()}-${originalName}`,
        folder: `/mossmenu/${folder}`,
        useUniqueFileName: true,
    });

    console.log("✅ ImageKit'ga yuklandi:", result.url);
    return result.url;
};

/**
 * Rasmni ImageKit dan o'chirish
 * @param {string} imageUrl - DB dagi rasm URL si
 */
export const deleteFromImageKit = async (imageUrl) => {
    if (!imageUrl) return;
    if (!imageUrl.includes("ik.imagekit.io")) return;

    try {
        const fileName = imageUrl.split("/").pop().split("?")[0];

        const files = await imagekit.files.list({
            searchQuery: `name = "${fileName}"`,
        });

        if (files && files.length > 0) {
            await imagekit.files.delete(files[0].fileId);
            console.log("ImageKit dan o'chirildi:", fileName);
        }
    } catch (e) {
        console.warn("ImageKit o'chirishda xato:", e.message);
    }
};
