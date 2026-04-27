import { Product } from "../models/product.model.js";
import { NotFoundException } from "../exceptions/not-found.exception.js";
import {
    uploadToImageKit,
    deleteFromImageKit,
} from "../helpers/imagekit.helper.js";

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

            price = Number(price);
            if (isNaN(price) || price < 0 || price > 1_000_000) {
                return res.status(400).send({
                    success: false,
                    message: "Narx 0 dan 1,000,000 so'mgacha bo'lishi kerak",
                });
            }

            if (raiting !== undefined) {
                raiting = Number(raiting);
                if (isNaN(raiting) || raiting < 1 || raiting > 5) {
                    return res.status(400).send({
                        success: false,
                        message: "Reyting 1-5 oraligida bo'lishi kerak",
                    });
                }
            } else {
                raiting = 4;
            }

            // ✅ ImageKit ga yuklash
            let imageUrl = req.body.image || "";
            if (req.file) {
                imageUrl = await uploadToImageKit(
                    req.file.buffer,
                    req.file.originalname,
                    "products",
                );
            }

            const newProduct = await this.#_productModel.create({
                name,
                price,
                raiting,
                category_id,
                image: imageUrl,
            });

            res.status(201).send({ success: true, data: newProduct });
        } catch (err) {
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
                            "Narx 0 dan 1,000,000 so'mgacha bo'lishi kerak",
                    });
                }
                updates.price = price;
            }

            if (updates.raiting !== undefined) {
                let raiting = Number(updates.raiting);
                if (isNaN(raiting) || raiting < 1 || raiting > 5) {
                    return res.status(400).send({
                        success: false,
                        message: "Reyting 1-5 oraligida bo'lishi kerak",
                    });
                }
                updates.raiting = raiting;
            }

            if (req.file) {
                // ✅ Eski rasmni ImageKit dan o'chir
                await deleteFromImageKit(existing.image);
                // ✅ Yangi rasmni ImageKit ga yuklash
                updates.image = await uploadToImageKit(
                    req.file.buffer,
                    req.file.originalname,
                    "products",
                );
            }

            const updated = await this.#_productModel.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true },
            );
            res.send({ success: true, data: updated });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await this.#_productModel.findById(id);
            if (!product) throw new NotFoundException("Product not found");

            // ✅ ImageKit dan o'chirish
            await deleteFromImageKit(product.image);

            await this.#_productModel.findByIdAndDelete(id);
            res.send({ success: true, message: "Product deleted" });
        } catch (err) {
            next(err);
        }
    };
}

export default new ProductController();
