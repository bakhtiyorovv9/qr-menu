import Joi from "joi";

export const CreateFeedbackSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email(),
    message: Joi.string().min(3).max(2000).required(),
    rating: Joi.number().min(1).max(5),
    type: Joi.string()
        .valid("SUGGESTION", "COMPLAINT", "REVIEW")
        .default("REVIEW"),
    product_id: Joi.string().hex().length(24),
    user_id: Joi.string().hex().length(24),
});

export const UpdateFeedbackSchema = Joi.object({
    name: Joi.string().min(1).max(100),
    email: Joi.string().email(),
    message: Joi.string().min(3).max(2000),
    rating: Joi.number().min(1).max(5),
    type: Joi.string().valid("SUGGESTION", "COMPLAINT", "REVIEW"),
    product_id: Joi.string().hex().length(24),
}).min(1);
