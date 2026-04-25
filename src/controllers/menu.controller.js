import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

class MenuController {
    async getMenu(req, res) {
        try {
            const { category, q } = req.query;
            const filter = {};
            if (category) filter.category_id = category;
            if (q) filter.name = { $regex: q, $options: "i" };

            const [categories, products] = await Promise.all([
                Category.find().lean(),
                Product.find(filter)
                    .populate("category_id")
                    .lean(),
            ]);

            res.render("menu", {
                layout: false,
                title: "Menyu - MossMenu",
                categories,
                products,
                activeCategory: category ? String(category) : null,
                q: q || "",
                year: new Date().getFullYear(),
            });
        } catch (error) {
            console.error("MenuController.getMenu error:", error.message);
            res.render("menu", {
                layout: "main",
                title: "Menyu - MossMenu",
                categories: [],
                products: [],
                activeCategory: null,
                q: "",
                year: new Date().getFullYear(),
            });
        }
    }
}

export default new MenuController();
