// src/controllers/home.controller.js
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { Feedback } from "../models/feedback.model.js";

class HomeController {
    getHome = async (req, res) => {
        try {
            const [categories, featuredProducts, rawFeedbacks] =
                await Promise.all([
                    Category.find().lean(),

                    Product.find()
                        .sort({ raiting: -1 })
                        .limit(3)
                        .populate("category_id")
                        .lean(),

                    Feedback.find({
                        type: { $in: ["review", "suggestion"] },
                        message: { $exists: true, $ne: "" },
                    })
                        .sort({ createdAt: -1 })
                        .limit(3)
                        .populate("created_at", "name email")
                        .lean(),
                ]);

            const recentFeedbacks = rawFeedbacks.map((f) => ({
                ...f,
                userName: f.created_at?.name || "Mehmon",
                userInitial: (f.created_at?.name || "M")[0].toUpperCase(),
                typeLabel: f.type === "review" ? "Sharh" : "Taklif",
            }));

            res.render("home", {
                layout: false,
                title: "MossMenu — Taomlarni Tabiat bilan his eting",
                categories,
                featuredProducts,
                recentFeedbacks,
                year: new Date().getFullYear(),
            });
        } catch (error) {
            console.error("HomeController.getHome error:", error.message);
            res.render("home", {
                layout: false,
                title: "MossMenu — Taomlarni Tabiat bilan his eting",
                categories: [],
                featuredProducts: [],
                recentFeedbacks: [],
                year: new Date().getFullYear(),
            });
        }
    };
}

export default new HomeController();
