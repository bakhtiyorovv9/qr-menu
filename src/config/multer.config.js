import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uploads papkasining to‘liq yo‘li
const uploadDir = path.join(__dirname, "../../uploads");

// Agar papka mavjud bo‘lmasa, yaratish
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `img-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extValid = allowed.test(
        path.extname(file.originalname).toLowerCase(),
    );
    const mimeValid = allowed.test(file.mimetype);
    if (extValid && mimeValid) {
        cb(null, true);
    } else {
        cb(new Error("Faqat rasm fayllari (JPEG, PNG, WEBP) yuklanadi!"));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
