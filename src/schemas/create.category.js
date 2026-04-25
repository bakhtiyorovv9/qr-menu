import Joi from "joi";

export const CreateCategorySchema = Joi.object({
    name: Joi.string().min(1).required(),
    user_id: Joi.string(),
});
