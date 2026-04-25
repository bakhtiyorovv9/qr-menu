import { Router } from "express";
import menuController from "../controllers/menu.controller.js";

const menuRouter = Router();

menuRouter.get("/", menuController.getMenu);

export default menuRouter;
