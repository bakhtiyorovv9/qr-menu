import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

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
    // URL dan public_id ni ajratib olish
    const parts = imageUrl.split("/");
    const filenameWithExt = parts.pop();
    const filename = filenameWithExt.split(".")[0];
    const folder = parts.slice(parts.indexOf("upload") + 2).join("/");
    const publicId = folder ? `${folder}/${filename}` : filename;
    await cloudinary.uploader.destroy(publicId);
};
