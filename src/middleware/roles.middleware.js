import { ForbiddenException } from "../exceptions/forbiddent-exception.js";

export const Roles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            console.log(req);
            throw new ForbiddenException("You don't have access");
        }
        next();
    };
};
