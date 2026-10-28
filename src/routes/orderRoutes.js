import { Router } from "express";
import { createAdminOrder, deleteAdminOrder, listAdminOrders, listMyOrders, placeOrder, updateAdminOrder } from "../controllers/orderController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { orderSchema, orderStatusSchema } from "../validation/schemas.js";

export const publicOrderRouter = Router();
publicOrderRouter.post("/", optionalAuth, validate(orderSchema), placeOrder);
publicOrderRouter.get("/mine", requireAuth, listMyOrders);

export const adminOrderRouter = Router();
adminOrderRouter.get("/", listAdminOrders);
adminOrderRouter.post("/", validate(orderSchema), createAdminOrder);
adminOrderRouter.patch("/:id", validate(orderStatusSchema), updateAdminOrder);
adminOrderRouter.delete("/:id", deleteAdminOrder);
