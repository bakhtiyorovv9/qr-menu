import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { isAuth } from "../middleware/protected.middleware.js";
import feedbackController from "../controllers/feedback.controller.js";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), "uploads"));
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const ext = path.extname(file.originalname);
        cb(null, `feedback-${unique}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        allowed.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error("Faqat rasm fayllari (jpg, png, webp)"), false);
    },
});

const feedbackRouter = Router();

feedbackRouter.get("/", feedbackController.getPage);

feedbackRouter.post(
    "/",
    isAuth,
    upload.single("image"),
    feedbackController.submit,
);

export default feedbackRouter;
