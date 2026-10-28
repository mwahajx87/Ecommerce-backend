import { Router } from "express";
import { createAdminProduct, deleteAdminProduct, listAdminProducts, updateAdminProduct } from "../controllers/productController.js";
import { deleteAdminOrder, listAdminOrders, createAdminOrder, updateAdminOrder } from "../controllers/orderController.js";
import { deleteUser, listUsers, updateUser } from "../controllers/userController.js";
import { getMetrics } from "../controllers/dashboardController.js";
import { validate } from "../middleware/validate.js";
import { productSchema, productUpdateSchema, userUpdateSchema, orderSchema, orderStatusSchema } from "../validation/schemas.js";

const router = Router();
router.get("/products", listAdminProducts);
router.post("/products", validate(productSchema), createAdminProduct);
router.put("/products/:id", validate(productUpdateSchema), updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);
router.get("/orders", listAdminOrders);
router.post("/orders", validate(orderSchema), createAdminOrder);
router.patch("/orders/:id", validate(orderStatusSchema), updateAdminOrder);
router.delete("/orders/:id", deleteAdminOrder);
router.get("/users", listUsers);
router.patch("/users/:id", validate(userUpdateSchema), updateUser);
router.delete("/users/:id", deleteUser);
router.get("/dashboard/metrics", getMetrics);

export default router;
