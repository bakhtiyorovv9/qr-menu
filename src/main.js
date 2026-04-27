import express from "express";
import { engine } from "express-handlebars";
import cookieParser from "cookie-parser";
import path from "node:path";
import { config } from "dotenv";

import appConfig from "./config/app.config.js";
import { connectDB } from "./config/database.js";
import { ErrorHandlerMiddleware } from "./middleware/error-handler.middleware.js";

import hbsHelpers from "./helpers/hbs-helpers.js";

import authController from "./controllers/auth.controller.js";
import homeController from "./controllers/home.controller.js";

import apiRouter from "./routes/index.js";
import adminRouter from "./routes/admin.route.js";
import menuRouter from "./routes/menu.router.js";
import feedbackRouter from "./routes/feedback.route.js";
import { attachUser } from "./middleware/protected.middleware.js";
import fs from "node:fs"
config();

fs.mkdirSync(path.join(process.cwd(), "uploads"), { recursive: true });

const app = express();

app.engine(
    "hbs",
    engine({
        extname: "hbs",
        layoutsDir: path.join(process.cwd(), "src", "views", "layouts"),
        helpers: hbsHelpers,
    }),
);
app.set("view engine", "hbs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET_KEY));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/public", express.static(path.join(process.cwd(), "src", "public")));

connectDB()
    .then((res) => console.log(res))
    .catch((err) => console.log(err));

app.use(cookieParser(process.env.COOKIE_SECRET_KEY));
app.use(attachUser); 

await authController.seeAdmins();

app.get("/", homeController.getHome);
app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
        error: req.query.error || null,
        success: req.query.success || null,
        oldEmail: req.query.email || "",
        oldName: req.query.name || "",
    });
});
app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
        error: req.query.error || null,
        success: req.query.success || null,
        oldEmail: req.query.email || "",
    });
});

app.get("/logout", authController.logout);

app.use("/api", apiRouter);
app.use("/", adminRouter);
app.use("/menu", menuRouter);
app.use("/feedback", feedbackRouter);

app.all("*splat", (req, res) => {
    res.status(404).render("404", {
        layout: false, 
        title: "Sahifa topilmadi",
        url: req.originalUrl,
        user: req.user || null,
    });
});

app.use(ErrorHandlerMiddleware);

process.on("uncaughtException", (err) => {
    console.log("uncaughtException:", err);
    process.exit(1);
});

const server = app.listen(appConfig.APP_PORT, () => {
    console.log(`listening on port ${appConfig.APP_PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
    console.log("unhandledRejection:", reason, promise);
    server.close(() => process.exit(1));
});
