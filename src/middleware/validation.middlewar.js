import { BadRequestException } from "../exceptions/bad-request.exception.js";

export const ValidationMiddleware = (schema, target = `body`) => {
    const ALLOWED_TARGETS = [`body`, `query`, `params`];

    if (!ALLOWED_TARGETS.includes(target)) {
        throw new Error(`Validation target invalid`);
    }

    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req[target]);

            if (error) {
                let errMsg = ``;
                errMsg = error.details?.map((err) => err.message).join(`| `);
                throw new BadRequestException(errMsg);
            }

            req[target] = value;
            next();
        } catch (err) {
            next(err);
        }
    };
};
