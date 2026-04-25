import { Product } from "../models/product.model.js";
import { NotFoundException } from "../exceptions/not-found.exception.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

class ProductController {
    #_productModel;
    constructor() {
        this.#_productModel = Product;
    }

    getAll = async (req, res, next) => {
        try {
            const { category, q } = req.query;
            const filter = {};
            if (category) filter.category_id = category;
            if (q) filter.name = { $regex: q, $options: "i" };
            const products = await this.#_productModel
                .find(filter)
                .populate("category_id")
                .sort({ createdAt: -1 });
            res.send({ success: true, data: products });
        } catch (err) {
            next(err);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await this.#_productModel
                .findById(id)
                .populate("category_id");
            if (!product) throw new NotFoundException("Product not found");
            res.send({ success: true, data: product });
        } catch (err) {
            next(err);
        }
    };

    create = async (req, res, next) => {
        try {
            let { name, price, raiting, category_id } = req.body;
            const image = req.file ? req.file.filename : req.body.image || "";

            price = Number(price);
            if (isNaN(price) || price < 0 || price > 1_000_000) {
                return res.status(400).send({
                    success: false,
                    message: "Narx 0 dan 1,000,000 so‘mgacha bo‘lishi kerak",
                });
            }

            if (raiting !== undefined) {
                raiting = Number(raiting);
                if (isNaN(raiting) || raiting < 1 || raiting > 5) {
                    return res.status(400).send({
                        success: false,
                        message: "Reyting 1–5 oralig‘ida bo‘lishi kerak",
                    });
                }
            } else {
                raiting = 4;
            }

            const newProduct = await this.#_productModel.create({
                name,
                price,
                raiting,
                category_id,
                image,
            });

            res.status(201).send({ success: true, data: newProduct });
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
            const existing = await this.#_productModel.findById(id);
            if (!existing) throw new NotFoundException("Product not found");

            let updates = { ...req.body };

            if (updates.price !== undefined) {
                let price = Number(updates.price);
                if (isNaN(price) || price < 0 || price > 1_000_000) {
                    return res.status(400).send({
                        success: false,
                        message:
                            "Narx 0 dan 1,000,000 so‘mgacha bo‘lishi kerak",
                    });
                }
                updates.price = price;
            }

            if (updates.raiting !== undefined) {
                let raiting = Number(updates.raiting);
                if (isNaN(raiting) || raiting < 1 || raiting > 5) {
                    return res.status(400).send({
                        success: false,
                        message: "Reyting 1–5 oralig‘ida bo‘lishi kerak",
                    });
                }
                updates.raiting = raiting;
            }

            if (req.file) {
                if (existing.image) {
                    const oldPath = path.join(uploadDir, existing.image);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                updates.image = req.file.filename;
            }

            const updated = await this.#_productModel.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true },
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
            const product = await this.#_productModel.findById(id);
            if (!product) throw new NotFoundException("Product not found");

            if (product.image) {
                const filePath = path.join(uploadDir, product.image);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }

            await this.#_productModel.findByIdAndDelete(id);
            res.send({ success: true, message: "Product deleted" });
        } catch (err) {
            next(err);
        }
    };
}

export default new ProductController();
