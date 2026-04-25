import { Router } from "express";
import authRouter from "./auth.route.js";
import homeRouter from "./home.route.js";
import productRouter from "./product.route.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/", homeRouter);

export default apiRouter;
