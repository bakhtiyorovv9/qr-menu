import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { config } from "dotenv";

config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

export const deleteFromCloudinary = async (imageUrl) => {
    if (!imageUrl) return;
    try {
        // Cloudinary URL formatidan public_id ajratib olish
        // Misol: https://res.cloudinary.com/demo/image/upload/v1234567890/categories/filename.jpg
        const uploadIndex = imageUrl.indexOf("/upload/");
        if (uploadIndex === -1) return;
        // /upload/ dan keyingi qism: v1234567890/categories/filename.jpg
        const afterUpload = imageUrl.slice(uploadIndex + 8);
        // Version prefixini olib tashlash (v1234567890/)
        const withoutVersion = afterUpload.replace(/^v\d+\//, "");
        // Kengaytmani olib tashlash
        const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error("Cloudinary delete error:", err);
    }
};
