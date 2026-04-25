import Joi from "joi";

export const CreateProductSchema = Joi.object({
    name: Joi.string().min(1).required(),
    price: Joi.number().min(0.1).required(),
    raiting: Joi.number().min(1).max(5).required(),
    category_id: Joi.string().hex().length(24).required(),
    image: Joi.string(),
});

export const UpdateProductSchema = Joi.object({
    name: Joi.string().min(1),
    price: Joi.number().min(0.1),
    raiting: Joi.number().min(1).max(5),
    category_id: Joi.string().hex().length(24),
    image: Joi.string(),
}).min(1);
