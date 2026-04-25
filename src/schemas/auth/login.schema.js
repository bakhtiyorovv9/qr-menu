import Joi from "joi";

export const LoginShema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().alphanum().min(6).required(),
});
