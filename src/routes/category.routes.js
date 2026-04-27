import { Router } from "express";
import multer from "multer";
import categoryController from "../controllers/category.controller.js";

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

const categoryRouter = Router();

categoryRouter
    .get("/", categoryController.getAll)
    .post("/", upload.single("image"), categoryController.create)
    .patch("/:id", upload.single("image"), categoryController.update)
    .delete("/:id", categoryController.delete);

export default categoryRouter;
