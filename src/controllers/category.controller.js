// import { Category } from "../models/category.model.js";
// import { NotFoundException } from "../exceptions/not-found.exception.js";
// import {
//     uploadToImageKit,
//     deleteFromImageKit,
// } from "../helpers/imagekit.helper.js";

// class CategoryController {
//     #_categoryModel;
//     constructor() {
//         this.#_categoryModel = Category;
//     }

//     getAll = async (req, res, next) => {
//         try {
//             const categories = await this.#_categoryModel
//                 .find()
//                 .sort({ order: 1 });
//             res.send({ success: true, data: categories });
//         } catch (err) {
//             next(err);
//         }
//     };

//     create = async (req, res, next) => {
//         try {
//             const { name, icon, order } = req.body;

//             // ✅ ImageKit ga yuklash
//             let imageUrl = "";
//             if (req.file) {
//                 imageUrl = await uploadToImageKit(
//                     req.file.buffer,
//                     req.file.originalname,
//                     "categories",
//                 );
//             }

//             const newCategory = await this.#_categoryModel.create({
//                 name,
//                 image: imageUrl,
//                 icon,
//                 order,
//             });
//             res.status(201).send({ success: true, data: newCategory });
//         } catch (err) {
//             next(err);
//         }
//     };

//     update = async (req, res, next) => {
//         try {
//             const { id } = req.params;
//             const existing = await this.#_categoryModel.findById(id);
//             if (!existing) throw new NotFoundException("Category not found");

//             let updates = { ...req.body };

//             if (req.file) {
//                 // ✅ Eski rasmni ImageKit dan o'chir
//                 await deleteFromImageKit(existing.image);
//                 // ✅ Yangi rasmni ImageKit ga yuklash
//                 updates.image = await uploadToImageKit(
//                     req.file.buffer,
//                     req.file.originalname,
//                     "categories",
//                 );
//             }

//             const updated = await this.#_categoryModel.findByIdAndUpdate(
//                 id,
//                 updates,
//                 { new: true },
//             );
//             res.send({ success: true, data: updated });
//         } catch (err) {
//             next(err);
//         }
//     };

//     delete = async (req, res, next) => {
//         try {
//             const { id } = req.params;
//             const category = await this.#_categoryModel.findById(id);
//             if (!category) throw new NotFoundException("Category not found");

//             // ✅ ImageKit dan o'chirish
//             await deleteFromImageKit(category.image);

//             await this.#_categoryModel.findByIdAndDelete(id);
//             res.send({ success: true, message: "Category deleted" });
//         } catch (err) {
//             next(err);
//         }
//     };
// }

// export default new CategoryController();

import { Category } from "../models/category.model.js";
import { NotFoundException } from "../exceptions/not-found.exception.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary,
} from "../helpers/cloudinary.helper.js";

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

            let imageUrl = "";
            if (req.file) {
                imageUrl = await uploadToCloudinary(
                    req.file.buffer,
                    req.file.originalname,
                    "categories",
                );
            }

            const newCategory = await this.#_categoryModel.create({
                name,
                image: imageUrl,
                icon,
                order,
            });
            res.status(201).send({ success: true, data: newCategory });
        } catch (err) {
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
                await deleteFromCloudinary(existing.image);
                updates.image = await uploadToCloudinary(
                    req.file.buffer,
                    req.file.originalname,
                    "categories",
                );
            }

            const updated = await this.#_categoryModel.findByIdAndUpdate(
                id,
                updates,
                { new: true },
            );
            res.send({ success: true, data: updated });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const category = await this.#_categoryModel.findById(id);
            if (!category) throw new NotFoundException("Category not found");

            await deleteFromCloudinary(category.image);
            await this.#_categoryModel.findByIdAndDelete(id);
            res.send({ success: true, message: "Category deleted" });
        } catch (err) {
            next(err);
        }
    };
}

export default new CategoryController();