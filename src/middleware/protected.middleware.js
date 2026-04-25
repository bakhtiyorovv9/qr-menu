// middleware/protected.middleware.js
import jwt from "jsonwebtoken";
import jwtConfig from "../config/jwt.config.js";

export const isAdmin = (req, res, next) => {
    try {
        const token = req.signedCookies?.token;
        if (!token) return res.redirect("/login");

        const payload = jwt.verify(token, jwtConfig.SECRET_KEY);
        if (payload.role === "ADMIN") {
            req.user = payload;
            return next();
        }
        return res.status(403).send("Ruxsat yo'q");
    } catch (err) {
        console.log("JWT xato:", err.message);
        return res.redirect("/login");
    }
};

export const isAuth = (req, res, next) => {
    try {
        const token = req.signedCookies?.token;
        if (!token) return res.redirect("/login");

        const payload = jwt.verify(token, jwtConfig.SECRET_KEY);
        req.user = payload;
        return next();
    } catch (err) {
        return res.redirect("/login");
    }
};

export const isGuest = (req, res, next) => {
    const token = req.signedCookies?.token;
    if (!token) return next();
    return res.redirect("/");
};

export const attachUser = (req, res, next) => {
    try {
        const token = req.signedCookies?.token;
        if (!token) {
            req.user = null;
            res.locals.user = null;
            return next();
        }

        const payload = jwt.verify(token, jwtConfig.SECRET_KEY);

        const user = {
            id: payload.id,
            name: payload.name,
            role: payload.role,
            initial: (payload.name || "U")[0].toUpperCase(),
            isAdmin: payload.role === "ADMIN",
        };

        req.user = user;
        res.locals.user = user;
        next();
    } catch (err) {
        res.clearCookie("token", { signed: true, httpOnly: true });
        res.clearCookie("refreshToken", { signed: true, httpOnly: true });
        req.user = null;
        res.locals.user = null;
        next();
    }
};
