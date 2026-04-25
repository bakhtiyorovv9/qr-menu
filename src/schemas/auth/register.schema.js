import Joi from "joi";

export const RegisterShema = Joi.object({
    name: Joi.string().min(1).required(),
    email: Joi.string().email().required(),
    password: Joi.string().alphanum().min(6).required(),
});
