import { Router } from "express";
import { createProductReview, listProductReviews, listRecentReviews } from "../controllers/reviewController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { reviewSchema } from "../validation/schemas.js";

const router = Router();
router.get("/reviews", listRecentReviews);
router.get("/products/:id/reviews", listProductReviews);
router.post("/products/:id/reviews", requireAuth, requireRole("customer"), validate(reviewSchema), createProductReview);

export default router;
