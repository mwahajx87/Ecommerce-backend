import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";
import { listProductReviews, saveProductReview } from "../controllers/reviewController.js";
import { requireAdmin, requireCustomer } from "../middleware/auth.js";

const router = Router();
router.get("/", listProducts);
router.get("/:productId/reviews", listProductReviews);
router.post("/:productId/reviews", requireCustomer, saveProductReview);
router.post("/", requireAdmin, createProduct);
router.put("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);
export default router;
