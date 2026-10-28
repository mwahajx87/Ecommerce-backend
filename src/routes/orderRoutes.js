import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  listCustomerOrders,
  listOrders,
  updateOrder,
} from "../controllers/orderController.js";
import { optionalCustomer, requireAdmin, requireCustomer } from "../middleware/auth.js";

const router = Router();
router.post("/", optionalCustomer, createOrder);
router.get("/mine", requireCustomer, listCustomerOrders);
router.get("/", requireAdmin, listOrders);
router.patch("/:id", requireAdmin, updateOrder);
router.delete("/:id", requireAdmin, deleteOrder);
export default router;
