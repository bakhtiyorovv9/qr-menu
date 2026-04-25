import { Router } from "express";
import { ValidationMiddleware } from "../middleware/validation.middlewar.js";
import {
    CreateProductSchema,
    UpdateProductSchema,
} from "../schemas/product.schema.js";
import productController from "../controllers/product.controller.js";

const productRouter = Router();

productRouter
    .get("/", productController.getAll)
    .get("/:id", productController.getOne)
    .post(
        "/",
        ValidationMiddleware(CreateProductSchema),
        productController.create,
    )
    .patch(
        "/:id",
        ValidationMiddleware(UpdateProductSchema),
        productController.update,
    )
    .delete("/:id", productController.delete);

export default productRouter;
