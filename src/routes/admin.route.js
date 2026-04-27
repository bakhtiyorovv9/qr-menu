import { Router } from "express";
import multer from "multer";
import { isAdmin } from "../middleware/protected.middleware.js";
import adminController from "../controllers/admin.controller.js";

const router = Router();

// ── MULTER: memoryStorage (ImageKit uchun disk emas RAM) ──────────────────────
// diskStorage o'rniga memoryStorage — fayl buffer sifatida keladi (req.file.buffer)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error("Faqat rasm fayllari (jpg, png, webp)"), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.get("/admin", isAdmin, adminController.getAdminDashboard);

router.get("/admin/categories", isAdmin, adminController.getCategoryList);
router.get(
    "/admin/categories/create",
    isAdmin,
    adminController.getCreateCategory,
);
router.post(
    "/admin/categories/create",
    isAdmin,
    upload.single("image"),
    adminController.postCreateCategory,
);
router.get(
    "/admin/categories/:id/edit",
    isAdmin,
    adminController.getEditCategory,
);
router.post(
    "/admin/categories/:id/edit",
    isAdmin,
    upload.single("image"),
    adminController.postEditCategory,
);
router.post(
    "/admin/categories/:id/delete",
    isAdmin,
    adminController.deleteCategory,
);

router.get("/admin/products", isAdmin, adminController.getProductList);
router.get("/admin/products/create", isAdmin, adminController.getCreateProduct);
router.post(
    "/admin/products/create",
    isAdmin,
    upload.single("image_file"),
    adminController.postCreateProduct,
);
router.get("/admin/products/:id/edit", isAdmin, adminController.getEditProduct);
router.post(
    "/admin/products/:id/edit",
    isAdmin,
    upload.single("image_file"),
    adminController.postEditProduct,
);
router.post(
    "/admin/products/:id/delete",
    isAdmin,
    adminController.deleteProduct,
);

router.get("/admin/feedbacks", isAdmin, adminController.getFeedbackList);
router.post(
    "/admin/feedbacks/:id/delete",
    isAdmin,
    adminController.deleteFeedback,
);

router.get("/admin/users", isAdmin, adminController.getUserList);
router.post("/admin/users/:id/delete", isAdmin, adminController.deleteUser);

router.get("/logout", adminController.logout);

export default router;
