import { Router } from "express";
import { ValidationMiddleware } from "../middleware/validation.middlewar.js";
import {
    CreateProductSchema,
    UpdateProductSchema,
} from "../schemas/product.schema.js";
import productController from "../controllers/product.controller.js";
import { upload } from "../middleware/upload.middleware.js"; // ✅ { upload }

const productRouter = Router();

productRouter
    .get("/", productController.getAll)
    .get("/:id", productController.getOne)
    .post(
        "/",
        upload.single("image"),
        ValidationMiddleware(CreateProductSchema),
        productController.create,
    )
    .patch(
        "/:id",
        upload.single("image"),
        ValidationMiddleware(UpdateProductSchema),
        productController.update,
    )
    .delete("/:id", productController.delete);

export default productRouter;
