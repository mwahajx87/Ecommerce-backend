import { Router } from "express";
import dashboardRoutes from "./dashboardRoutes.js";
import orderRoutes from "./orderRoutes.js";
import productRoutes from "./productRoutes.js";
import userRoutes from "./userRoutes.js";
import { isAdmin } from "../middleware/auth.js";

const router = Router();

router.use(isAdmin);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
