import { config } from "dotenv";
import signature from "../config/signed.config.js";
import { BlackholedSignatureError, ExpiredSignatureError } from "signed";
import { ConflictException } from "../exceptions/conflict.exception.js";

config();

const BASE_URL = process.env.BASE_URL;

export const VerifySignatureMiddleware = (req, res, next) => {
    try {
        const fullUrl = `${BASE_URL}/auth${req.url}`;

        signature.verify(fullUrl);

        next();
    } catch (err) {
        if (err instanceof BlackholedSignatureError) {
            throw new ConflictException(`signature is not valid`);
        }
        if (err instanceof ExpiredSignatureError) {
            throw new ConflictException(`signature is expired`);
        }
        next(err);
    }
};
