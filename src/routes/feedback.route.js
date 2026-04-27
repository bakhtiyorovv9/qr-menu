import { Router } from "express";
import multer from "multer";
import { isAuth } from "../middleware/protected.middleware.js";
import feedbackController from "../controllers/feedback.controller.js";

// ✅ diskStorage o'rniga memoryStorage (ImageKit uchun req.file.buffer kerak)
const upload = multer({
    storage: multer.memoryStorage(),
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
