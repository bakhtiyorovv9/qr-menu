import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Feedback } from "../models/feedback.model.js";
import {
    uploadToImageKit,
    deleteFromImageKit,
} from "../helpers/imagekit.helper.js";

class AdminController {
    #getAdminMeta = (req) => ({
        adminName: req.user?.name || "Admin",
        adminInitial: (req.user?.name || "A")[0].toUpperCase(),
        today: new Date().toLocaleDateString("uz-UZ", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
    });

    #flash = {
        set: (res, data = {}) => {
            Object.entries(data).forEach(([k, v]) => {
                if (v)
                    res.cookie(`_f_${k}`, String(v), {
                        httpOnly: true,
                        maxAge: 10_000,
                    });
            });
        },
        get: (req, res, keys = []) => {
            const result = {};
            keys.forEach((k) => {
                result[k] = req.cookies?.[`_f_${k}`] || null;
                res.clearCookie(`_f_${k}`);
            });
            return result;
        },
    };

    // ── DASHBOARD ─────────────────────────────────────────────────────────────
    getAdminDashboard = async (req, res) => {
        try {
            const [totalProducts, totalCategories, totalUsers] =
                await Promise.all([
                    Product.countDocuments(),
                    Category.countDocuments(),
                    User.countDocuments(),
                ]);
            res.render("admin/dashboard", {
                title: "Dashboard",
                layout: "admin",
                isHome: true,
                ...this.#getAdminMeta(req),
                totalProducts,
                totalCategories,
                totalUsers,
            });
        } catch (err) {
            console.error("Dashboard error:", err);
            res.status(500).send("Server xatosi");
        }
    };

    // ── KATEGORIYA: LIST ──────────────────────────────────────────────────────
    getCategoryList = async (req, res) => {
        try {
            const categories = await Category.find()
                .populate("admin_id", "name email")
                .sort({ createdAt: -1 })
                .lean();

            const categoriesWithCount = await Promise.all(
                categories.map(async (cat) => ({
                    ...cat,
                    productCount: await Product.countDocuments({
                        category_id: cat._id,
                    }),
                    createdAtFormatted: new Date(
                        cat.createdAt,
                    ).toLocaleDateString("uz-UZ", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    }),
                })),
            );

            const f = this.#flash.get(req, res, ["success", "error"]);
            res.render("admin/categories", {
                title: "Kategoriyalar",
                layout: "admin",
                isCategoryList: true,
                ...this.#getAdminMeta(req),
                categories: categoriesWithCount,
                flash: { success: f.success, error: f.error },
            });
        } catch (err) {
            console.error("Category list error:", err);
            res.status(500).send("Server xatosi");
        }
    };

    // ── KATEGORIYA: CREATE ────────────────────────────────────────────────────
    getCreateCategory = (req, res) => {
        const f = this.#flash.get(req, res, ["error", "success", "oldName"]);
        res.render("admin/create-category", {
            title: "Kategoriya qo'shish",
            layout: "admin",
            isCategoryCreate: true,
            ...this.#getAdminMeta(req),
            error: f.error,
            success: f.success,
            oldName: f.oldName,
        });
    };

    postCreateCategory = async (req, res) => {
        try {
            const { name } = req.body;

            if (!name || name.trim().length < 1) {
                this.#flash.set(res, {
                    error: "Kategoriya nomi kamida 1 ta belgidan iborat bo'lishi kerak.",
                    oldName: name,
                });
                return res.redirect("/admin/categories/create");
            }
            const exists = await Category.findOne({ name: name.trim() });
            if (exists) {
                this.#flash.set(res, {
                    error: `"${name.trim()}" nomli kategoriya allaqachon mavjud.`,
                    oldName: name,
                });
                return res.redirect("/admin/categories/create");
            }

            // ✅ ImageKit ga yuklash
            let imagePath = null;
            if (req.file) {
                imagePath = await uploadToImageKit(
                    req.file.buffer,
                    req.file.originalname,
                    "categories",
                );
            }

            await Category.create({
                name: name.trim(),
                image: imagePath,
                admin_id: req.user.id,
            });
            this.#flash.set(res, {
                success: `"${name.trim()}" kategoriyasi muvaffaqiyatli qo'shildi!`,
            });
            return res.redirect("/admin/categories/create");
        } catch (err) {
            console.error("Create category error:", err);
            this.#flash.set(res, {
                error: "Server xatosi. Qaytadan urinib ko'ring.",
            });
            return res.redirect("/admin/categories/create");
        }
    };

    // ── KATEGORIYA: EDIT ──────────────────────────────────────────────────────
    getEditCategory = async (req, res) => {
        try {
            const category = await Category.findById(req.params.id).lean();
            if (!category) {
                this.#flash.set(res, { error: "Kategoriya topilmadi." });
                return res.redirect("/admin/categories");
            }
            const f = this.#flash.get(req, res, ["error"]);
            res.render("admin/edit-category", {
                title: "Kategoriyani tahrirlash",
                layout: "admin",
                isCategoryList: true,
                ...this.#getAdminMeta(req),
                category,
                error: f.error,
            });
        } catch (err) {
            console.error("Edit category GET error:", err);
            res.status(500).send("Server xatosi");
        }
    };

    postEditCategory = async (req, res) => {
        try {
            const { name, icon, removeImage } = req.body;
            const { id } = req.params;

            if (!name || name.trim().length < 1) {
                this.#flash.set(res, {
                    error: "Kategoriya nomi bo'sh bo'lishi mumkin emas.",
                });
                return res.redirect(`/admin/categories/${id}/edit`);
            }
            const duplicate = await Category.findOne({
                name: name.trim(),
                _id: { $ne: id },
            });
            if (duplicate) {
                this.#flash.set(res, {
                    error: `"${name.trim()}" nomli kategoriya allaqachon mavjud.`,
                });
                return res.redirect(`/admin/categories/${id}/edit`);
            }
            const existing = await Category.findById(id);
            if (!existing) {
                this.#flash.set(res, { error: "Kategoriya topilmadi." });
                return res.redirect("/admin/categories");
            }

            const updateData = {
                name: name.trim(),
                icon: icon?.trim() || undefined,
            };

            if (req.file) {
                // ✅ Eski rasmni ImageKit dan o'chir, yangi yuklash
                await deleteFromImageKit(existing.image);
                updateData.image = await uploadToImageKit(
                    req.file.buffer,
                    req.file.originalname,
                    "categories",
                );
            } else if (removeImage === "1") {
                // ✅ Faqat o'chirish
                await deleteFromImageKit(existing.image);
                updateData.image = null;
            }

            await Category.findByIdAndUpdate(id, updateData);
            this.#flash.set(res, {
                success: `"${name.trim()}" kategoriyasi muvaffaqiyatli yangilandi!`,
            });
            return res.redirect("/admin/categories");
        } catch (err) {
            console.error("Edit category POST error:", err);
            this.#flash.set(res, {
                error: "Server xatosi. Qaytadan urinib ko'ring.",
            });
            return res.redirect(`/admin/categories/${req.params.id}/edit`);
        }
    };

    // ── KATEGORIYA: DELETE ────────────────────────────────────────────────────
    deleteCategory = async (req, res) => {
        try {
            const { id } = req.params;
            const category = await Category.findById(id);
            if (!category) {
                this.#flash.set(res, { error: "Kategoriya topilmadi." });
                return res.redirect("/admin/categories");
            }
            const productCount = await Product.countDocuments({
                category_id: id,
            });
            if (productCount > 0) {
                this.#flash.set(res, {
                    error: `"${category.name}" kategoriyasini o'chirib bo'lmaydi — unga ${productCount} ta mahsulot bog'liq.`,
                });
                return res.redirect("/admin/categories");
            }
            // ✅ ImageKit dan o'chirish
            await deleteFromImageKit(category.image);
            await Category.findByIdAndDelete(id);
            this.#flash.set(res, {
                success: `"${category.name}" kategoriyasi o'chirildi.`,
            });
            return res.redirect("/admin/categories");
        } catch (err) {
            console.error("Delete category error:", err);
            this.#flash.set(res, {
                error: "Server xatosi. Qaytadan urinib ko'ring.",
            });
            return res.redirect("/admin/categories");
        }
    };

    // ── MAHSULOT: LIST ────────────────────────────────────────────────────────
    getProductList = async (req, res) => {
        try {
            const products = await Product.find()
                .populate("category_id", "name")
                .sort({ createdAt: -1 })
                .lean();
            const f = this.#flash.get(req, res, ["success", "error"]);
            res.render("admin/products", {
                title: "Mahsulotlar",
                layout: "admin",
                isProductList: true,
                ...this.#getAdminMeta(req),
                products,
                flash: { success: f.success, error: f.error },
            });
        } catch (err) {
            console.error("Product list error:", err);
            res.status(500).send("Server xatosi");
        }
    };

    // ── MAHSULOT: CREATE ──────────────────────────────────────────────────────
    getCreateProduct = async (req, res) => {
        try {
            const categories = await Category.find().sort({ name: 1 }).lean();
            const f = this.#flash.get(req, res, [
                "error",
                "success",
                "oldName",
                "oldPrice",
                "oldRaiting",
                "oldCategory",
            ]);
            res.render("admin/create-product", {
                title: "Mahsulot qo'shish",
                layout: "admin",
                isProductCreate: true,
                ...this.#getAdminMeta(req),
                categories,
                error: f.error,
                success: f.success,
                oldName: f.oldName,
                oldPrice: f.oldPrice,
                oldRaiting: f.oldRaiting,
                oldCategory: f.oldCategory,
            });
        } catch (err) {
            console.error("Create product GET error:", err);
            res.status(500).send("Server xatosi");
        }
    };

    postCreateProduct = async (req, res) => {
        try {
            const { name, price, raiting, category_id } = req.body;

            const errors = [];
            if (!name?.trim()) errors.push("Mahsulot nomi kiritilmadi.");
            if (!price || parseFloat(price) < 0.1)
                errors.push("Narx noto'g'ri (min 0.1).");
            if (!raiting || +raiting < 1 || +raiting > 5)
                errors.push("Reyting 1-5 oraligida bolishi kerak.");
            if (!category_id) errors.push("Kategoriya tanlanmadi.");
            if (!req.file) errors.push("Rasm yuklanmadi.");

            if (errors.length > 0) {
                this.#flash.set(res, {
                    error: errors.join(" | "),
                    oldName: name,
                    oldPrice: price,
                    oldRaiting: raiting,
                    oldCategory: category_id,
                });
                return res.redirect("/admin/products/create");
            }

            // ✅ ImageKit ga yuklash
            const imagePath = await uploadToImageKit(
                req.file.buffer,
                req.file.originalname,
                "products",
            );

            await Product.create({
                name: name.trim(),
                price: parseFloat(price),
                raiting: parseInt(raiting),
                category_id,
                image: imagePath,
            });
            this.#flash.set(res, {
                success: `"${name.trim()}" muvaffaqiyatli qo'shildi!`,
            });
            return res.redirect("/admin/products/create");
        } catch (err) {
            console.error("Create product POST error:", err);
            this.#flash.set(res, {
                error: "Server xatosi. Qaytadan urinib ko'ring.",
            });
            return res.redirect("/admin/products/create");
        }
    };

    // ── MAHSULOT: EDIT ────────────────────────────────────────────────────────
    getEditProduct = async (req, res) => {
        try {
            const product = await Product.findById(req.params.id).lean();
            const categories = await Category.find().sort({ name: 1 }).lean();
            if (!product) {
                this.#flash.set(res, { error: "Mahsulot topilmadi." });
                return res.redirect("/admin/products");
            }
            const f = this.#flash.get(req, res, ["error"]);
            res.render("admin/edit-product", {
                title: "Mahsulotni tahrirlash",
                layout: "admin",
                isProductList: true,
                ...this.#getAdminMeta(req),
                product,
                categories,
                error: f.error,
            });
        } catch (err) {
            console.error("Edit product GET error:", err);
            res.status(500).send("Server xatosi");
        }
    };

    postEditProduct = async (req, res) => {
        try {
            const { name, price, raiting, category_id, removeImage } = req.body;
            const { id } = req.params;

            const errors = [];
            if (!name?.trim()) errors.push("Mahsulot nomi kiritilmadi.");
            if (!price || parseFloat(price) < 0.1)
                errors.push("Narx noto'g'ri (min 0.1).");
            if (!raiting || +raiting < 1 || +raiting > 5)
                errors.push("Reyting 1-5 oraligida bolishi kerak.");
            if (!category_id) errors.push("Kategoriya tanlanmadi.");

            if (errors.length > 0) {
                this.#flash.set(res, { error: errors.join(" | ") });
                return res.redirect(`/admin/products/${id}/edit`);
            }
            const existing = await Product.findById(id);
            if (!existing) {
                this.#flash.set(res, { error: "Mahsulot topilmadi." });
                return res.redirect("/admin/products");
            }

            const updateData = {
                name: name.trim(),
                price: parseFloat(price),
                raiting: parseInt(raiting),
                category_id,
            };

            if (req.file) {
                // ✅ Eski rasmni ImageKit dan o'chir, yangi yuklash
                await deleteFromImageKit(existing.image);
                updateData.image = await uploadToImageKit(
                    req.file.buffer,
                    req.file.originalname,
                    "products",
                );
            } else if (removeImage === "1") {
                await deleteFromImageKit(existing.image);
                updateData.image = null;
            }

            await Product.findByIdAndUpdate(id, updateData);
            this.#flash.set(res, {
                success: `"${name.trim()}" mahsuloti muvaffaqiyatli yangilandi!`,
            });
            return res.redirect("/admin/products");
        } catch (err) {
            console.error("Edit product POST error:", err);
            this.#flash.set(res, {
                error: "Server xatosi. Qaytadan urinib ko'ring.",
            });
            return res.redirect(`/admin/products/${req.params.id}/edit`);
        }
    };

    // ── MAHSULOT: DELETE ──────────────────────────────────────────────────────
    deleteProduct = async (req, res) => {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);
            if (!product) {
                this.#flash.set(res, { error: "Mahsulot topilmadi." });
                return res.redirect("/admin/products");
            }
            // ✅ ImageKit dan o'chirish
            await deleteFromImageKit(product.image);
            await Product.findByIdAndDelete(id);
            this.#flash.set(res, {
                success: `"${product.name}" mahsuloti o'chirildi.`,
            });
            return res.redirect("/admin/products");
        } catch (err) {
            console.error("Delete product error:", err);
            this.#flash.set(res, {
                error: "Server xatosi. Qaytadan urinib ko'ring.",
            });
            return res.redirect("/admin/products");
        }
    };

    // ── FEEDBACKLAR: LIST ─────────────────────────────────────────────────────
    getFeedbackList = async (req, res) => {
        try {
            const { type } = req.query;
            const filter = type ? { type } : {};
            const [feedbacks, totalCount, reviewCount, complaintCount] =
                await Promise.all([
                    Feedback.find(filter)
                        .populate("created_at", "name email")
                        .sort({ createdAt: -1 })
                        .lean(),
                    Feedback.countDocuments(),
                    Feedback.countDocuments({ type: "review" }),
                    Feedback.countDocuments({ type: "complaint" }),
                ]);
            const feedbacksFormatted = feedbacks.map((fb) => ({
                ...fb,
                createdAtFormatted: new Date(fb.createdAt).toLocaleDateString(
                    "uz-UZ",
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    },
                ),
            }));
            const f = this.#flash.get(req, res, ["success", "error"]);
            res.render("admin/feedbacks", {
                title: "Shikoyatlar",
                layout: "admin",
                isFeedbackList: true,
                ...this.#getAdminMeta(req),
                feedbacks: feedbacksFormatted,
                totalCount,
                reviewCount,
                complaintCount,
                activeType: type || null,
                flash: { success: f.success, error: f.error },
            });
        } catch (err) {
            console.error("Feedback list error:", err);
            res.status(500).send("Server xatosi");
        }
    };

    // ── FEEDBACKLAR: DELETE ───────────────────────────────────────────────────
    deleteFeedback = async (req, res) => {
        try {
            const { id } = req.params;
            const feedback = await Feedback.findById(id);
            if (!feedback) {
                this.#flash.set(res, { error: "Feedback topilmadi." });
                return res.redirect("/admin/feedbacks");
            }
            // ✅ ImageKit dan o'chirish
            await deleteFromImageKit(feedback.image);
            await Feedback.findByIdAndDelete(id);
            this.#flash.set(res, {
                success: "Feedback muvaffaqiyatli o'chirildi.",
            });
            return res.redirect("/admin/feedbacks");
        } catch (err) {
            console.error("Delete feedback error:", err);
            this.#flash.set(res, {
                error: "Server xatosi. Qaytadan urinib ko'ring.",
            });
            return res.redirect("/admin/feedbacks");
        }
    };

    // ── FOYDALANUVCHILAR: LIST ────────────────────────────────────────────────
    getUserList = async (req, res) => {
        try {
            const { role } = req.query;
            const filter = role ? { role } : {};
            const [users, totalCount, userCount, adminCount] =
                await Promise.all([
                    User.find(filter).sort({ createdAt: -1 }).lean(),
                    User.countDocuments(),
                    User.countDocuments({ role: "USER" }),
                    User.countDocuments({ role: "ADMIN" }),
                ]);
            const usersFormatted = await Promise.all(
                users.map(async (u) => ({
                    ...u,
                    feedbackCount: await Feedback.countDocuments({
                        created_at: u._id,
                    }),
                    createdAtFormatted: new Date(
                        u.createdAt,
                    ).toLocaleDateString("uz-UZ", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    }),
                })),
            );
            const f = this.#flash.get(req, res, ["success", "error"]);
            res.render("admin/users", {
                title: "Foydalanuvchilar",
                layout: "admin",
                isUserList: true,
                ...this.#getAdminMeta(req),
                users: usersFormatted,
                totalCount,
                userCount,
                adminCount,
                activeRole: role || null,
                flash: { success: f.success, error: f.error },
            });
        } catch (err) {
            console.error("User list error:", err);
            res.status(500).send("Server xatosi");
        }
    };

    // ── FOYDALANUVCHILAR: DELETE ──────────────────────────────────────────────
    deleteUser = async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                this.#flash.set(res, { error: "Foydalanuvchi topilmadi." });
                return res.redirect("/admin/users");
            }
            if (user.role === "ADMIN") {
                this.#flash.set(res, {
                    error: "Admin foydalanuvchisini o'chirib bo'lmaydi.",
                });
                return res.redirect("/admin/users");
            }
            await User.findByIdAndDelete(id);
            this.#flash.set(res, {
                success: `"${user.name}" foydalanuvchisi o'chirildi.`,
            });
            return res.redirect("/admin/users");
        } catch (err) {
            console.error("Delete user error:", err);
            this.#flash.set(res, {
                error: "Server xatosi. Qaytadan urinib ko'ring.",
            });
            return res.redirect("/admin/users");
        }
    };

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    logout = (req, res) => {
        res.clearCookie("token", { signed: true, httpOnly: true });
        res.clearCookie("refreshToken", { signed: true, httpOnly: true });
        res.redirect("/");
    };
}

export default new AdminController();
