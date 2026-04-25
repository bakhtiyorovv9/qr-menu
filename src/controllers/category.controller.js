import { Category } from "../models/category.model.js";
import { NotFoundException } from "../exceptions/not-found.exception.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

class CategoryController {
    #_categoryModel;
    constructor() {
        this.#_categoryModel = Category;
    }

    getAll = async (req, res, next) => {
        try {
            const categories = await this.#_categoryModel
                .find()
                .sort({ order: 1 });
            res.send({ success: true, data: categories });
        } catch (err) {
            next(err);
        }
    };

    create = async (req, res, next) => {
        try {
            const { name, icon, order } = req.body;
            const image = req.file ? req.file.filename : "";
            const newCategory = await this.#_categoryModel.create({
                name,
                image,
                icon,
                order,
            });
            res.status(201).send({ success: true, data: newCategory });
        } catch (err) {
            if (req.file) {
                const filePath = path.join(uploadDir, req.file.filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            next(err);
        }
    };

    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const existing = await this.#_categoryModel.findById(id);
            if (!existing) throw new NotFoundException("Category not found");

            let updates = { ...req.body };
            if (req.file) {
                if (existing.image) {
                    const oldPath = path.join(uploadDir, existing.image);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                updates.image = req.file.filename;
            }

            const updated = await this.#_categoryModel.findByIdAndUpdate(
                id,
                updates,
                { new: true },
            );
            res.send({ success: true, data: updated });
        } catch (err) {
            if (req.file) {
                const filePath = path.join(uploadDir, req.file.filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const category = await this.#_categoryModel.findById(id);
            if (!category) throw new NotFoundException("Category not found");

            if (category.image) {
                const filePath = path.join(uploadDir, category.image);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }

            await this.#_categoryModel.findByIdAndDelete(id);
            res.send({ success: true, message: "Category deleted" });
        } catch (err) {
            next(err);
        }
    };
}

export default new CategoryController();
