import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import jwtConfig from "../config/jwt.config.js";
import { NotFoundException } from "../exceptions/not-found.exception.js";
import { BadRequestException } from "../exceptions/bad-request.exception.js";
import signature from "../config/signed.config.js";
import { config } from "dotenv";
import { sendEMAil } from "../helpers/mail.helper.js";

config();

const BASE_URL = process.env.BASE_URL;

class AuthController {
    #_userModel;
    constructor() {
        this.#_userModel = User;
    }

    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;

            const existingUser = await this.#_userModel.findOne({ email });

            if (!existingUser) {
                return res.redirect(
                    `/login?error=${encodeURIComponent("Foydalanuvchi topilmadi")}&email=${encodeURIComponent(email || "")}`,
                );
            }

            const isPassSame = await this.#_comparePass(
                password,
                existingUser.password,
            );

            if (!isPassSame) {
                return res.redirect(
                    `/login?error=${encodeURIComponent("Parol noto'g'ri")}&email=${encodeURIComponent(email)}`,
                );
            }

            const refreshToken = this.#_generateRefreshToken({
                id: existingUser._id,
                name: existingUser.name,
                role: existingUser.role,
            });

            const token = this.#_generateAccessToken({
                id: existingUser._id,
                name: existingUser.name,
                role: existingUser.role,
            });

            res.cookie("token", token, {
                httpOnly: true,
                signed: true,
                secure: false,
                expires: new Date(Date.now() + 60 * 60 * 1000),
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                signed: true,
                secure: false,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            if (existingUser.role === "ADMIN") {
                return res.redirect("/admin");
            }

            return res.redirect("/");
        } catch (err) {
            next(err);
        }
    };

    register = async (req, res, next) => {
        try {
            const { name, password, email } = req.body;

            const existingUser = await this.#_userModel.findOne({ email });

            if (existingUser) {
                return res.redirect(
                    `/register?error=${encodeURIComponent("Bu email ro'yxatdan o'tgan")}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || "")}`,
                );
            }

            const hashedPass = await this.#_hashPassword(password);

            const newUser = await this.#_userModel.create({
                name,
                email,
                password: hashedPass,
                role: "USER",
            });

            const refreshToken = this.#_generateRefreshToken({
                id: newUser._id,
                name: newUser.name,
                role: newUser.role,
            });

            const token = this.#_generateAccessToken({
                id: newUser._id,
                name: newUser.name,
                role: newUser.role,
            });

            res.cookie("token", token, {
                httpOnly: true,
                signed: true,
                secure: false,
                expires: new Date(Date.now() + 60 * 60 * 1000),
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                signed: true,
                secure: false,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.redirect("/");
        } catch (err) {
            next(err);
        }
    };

    logout = (req, res) => {
        res.clearCookie("token", { signed: true, httpOnly: true });
        res.clearCookie("refreshToken", { signed: true, httpOnly: true });
        return res.redirect("/");
    };

    refresh = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                throw new BadRequestException(`Token not given`);
            }

            const payload = jwt.verify(
                refreshToken,
                jwtConfig.REFRESH_TOKEN_SECRET_KEY,
            );

            const accessToken = this.#_generateAccessToken({ id: payload.id });
            res.send({
                success: true,
                data: { accessToken },
            });
        } catch (err) {
            next(err);
        }
    };

    seeAdmins = async () => {
        const admnis = [
            {
                name: "admin",
                email: process.env.ADMIN_EMAIL,
                password: String(process.env.ADMIN_PASS),
            },
        ];

        for (let a of admnis) {
            const existingUser = await this.#_userModel.findOne({
                email: a.email,
            });

            if (!existingUser) {
                await this.#_userModel.create({
                    ...a,
                    role: "ADMIN",
                    password: await this.#_hashPassword(a.password),
                });
            }
        }

        console.log(`ADMINS SEEDED`);
    };

    forgotPass = async (req, res, next) => {
        try {
            const { email } = req.body;

            const foundedUser = await this.#_userModel.findOne({ email });

            if (!foundedUser) {
                throw new NotFoundException("User not found");
            }

            const signedUrl = signature.sign(
                `${BASE_URL}/auth/reset-password?userId=${foundedUser._id}`,
                { ttl: 1800 },
            );

            await sendEMAil(
                email,
                "Password reset",
                `Password reset link: ${signedUrl}`,
            );

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    resetPass = async (req, res, next) => {
        try {
            const { userId } = req.query;
            const { password } = req.body;

            if (!userId) {
                throw new NotFoundException("User no found");
            }

            const foundedUser = await this.#_userModel.findById(userId);

            if (!foundedUser) {
                throw new NotFoundException("User no found");
            }

            const hashedPass = await this.#_hashPassword(password);

            await this.#_userModel.updateOne(
                { _id: userId },
                { password: hashedPass },
            );

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    #_hashPassword = async (pass) => {
        return await bcrypt.hash(pass, 10);
    };

    #_comparePass = async (originalPass, hashedPass) => {
        return await bcrypt.compare(originalPass, hashedPass);
    };

    #_generateAccessToken = (payload) => {
        return jwt.sign(payload, jwtConfig.SECRET_KEY, {
            algorithm: "HS256",
            expiresIn: jwtConfig.EXPIRE_TIME,
        });
    };

    #_generateRefreshToken = (payload) => {
        return jwt.sign(payload, jwtConfig.REFRESH_TOKEN_SECRET_KEY, {
            algorithm: "HS256",
            expiresIn: jwtConfig.REFRESH_TOKEN_EXPIRE_TIME,
        });
    };
}

export default new AuthController();
