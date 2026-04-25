import { Router } from "express";
import { ValidationMiddleware } from "../middleware/validation.middlewar.js";
import { LoginShema } from "../schemas/auth/login.schema.js";
import authController from "../controllers/auth.controller.js";
import { RegisterShema } from "../schemas/auth/register.schema.js";
import { VerifySignatureMiddleware } from "../middleware/verify-sugnature.middleware.js";

const authRouter = Router();

authRouter
    .post("/login", ValidationMiddleware(LoginShema), authController.login)
    .post(
        "/register",
        ValidationMiddleware(RegisterShema),
        authController.register,
    )
    .post("/refresh", authController.refresh)
    .post("/forgot-pass", authController.forgotPass)
    .post(
        `/reset-password`,
        VerifySignatureMiddleware,
        authController.resetPass,
    );
export default authRouter;
