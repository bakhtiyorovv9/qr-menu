// // src/helpers/cloudinary.helper.js
// import cloudinary from "../config/cloudinary.config.js";
// import { Readable } from "node:stream";

// /**
//  * Rasmni Cloudinary ga yuklash
//  * @param {Buffer} fileBuffer    - req.file.buffer
//  * @param {string} folder        - "categories" | "products" | "feedbacks"
//  * @returns {Promise<string>}    - Yuklangan rasm URL si
//  */
// export const uploadToCloudinary = (fileBuffer, folder) => {
//     return new Promise((resolve, reject) => {
//         const uploadStream = cloudinary.uploader.upload_stream(
//             {
//                 folder: `mossmenu/${folder}`,
//                 resource_type: "image",
//                 transformation: [{ quality: "auto", fetch_format: "auto" }],
//             },
//             (error, result) => {
//                 if (error) return reject(error);
//                 resolve(result.secure_url);
//             },
//         );

//         // Buffer → Stream ga o'tkazish
//         const readable = new Readable();
//         readable.push(fileBuffer);
//         readable.push(null);
//         readable.pipe(uploadStream);
//     });
// };

// /**
//  * Rasmni Cloudinary dan o'chirish
//  * @param {string} imageUrl - DB dagi rasm URL si
//  */
// export const deleteFromCloudinary = async (imageUrl) => {
//     if (!imageUrl) return;
//     if (!imageUrl.includes("cloudinary.com")) return;

//     try {
//         // URL dan public_id ni olish
//         // Misol URL: https://res.cloudinary.com/demo/image/upload/v1234/mossmenu/categories/abc123.jpg
//         // public_id = mossmenu/categories/abc123
//         const urlParts = imageUrl.split("/upload/")[1]; // v1234/mossmenu/categories/abc123.jpg
//         const publicId = urlParts
//             .replace(/^v\d+\//, "") // v1234/ ni olib tashlash
//             .replace(/\.[^.]+$/, ""); // .jpg kengaytmasini olib tashlash

//         await cloudinary.uploader.destroy(publicId);
//         console.log("Cloudinary dan o'chirildi:", publicId);
//     } catch (e) {
//         console.warn("Cloudinary o'chirishda xato:", e.message);
//     }
// };


import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Cloudinary konfiguratsiyasi (.env fayldan o‘qiladi)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Buffer ma'lumotni Cloudinary'ga yuklaydi
 * @param {Buffer} buffer - Fayl bufferi
 * @param {string} originalName - Asl fayl nomi
 * @param {string} folder - Papka nomi (masalan "products")
 * @returns {Promise<string>} - Yuklangan rasmning secure_url
 */
export const uploadToCloudinary = (buffer, originalName, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: `${folder}/${Date.now()}_${originalName.split(".")[0]}`,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            },
        );

        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

/**
 * Cloudinary'dan rasmni o‘chiradi (URL orqali public_id aniqlanadi)
 * @param {string} imageUrl - Cloudinary'dagi rasmning to‘liq URL manzili
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (imageUrl) => {
    if (!imageUrl) return;

    // URL dan public_id ni ajratib olish
    // Misol: https://res.cloudinary.com/demo/image/upload/v123456/products/sample.jpg
    // public_id -> products/sample (extensiyasiz)
    const parts = imageUrl.split("/");
    const filenameWithExt = parts.pop();
    const filename = filenameWithExt.split(".")[0];
    const folder = parts.slice(parts.indexOf("upload") + 2).join("/");
    const publicId = folder ? `${folder}/${filename}` : filename;

    await cloudinary.uploader.destroy(publicId);
};
