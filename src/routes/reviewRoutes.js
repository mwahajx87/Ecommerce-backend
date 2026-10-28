import { Router } from "express";
import { listRecentReviews } from "../controllers/publicReviewController.js";

const router = Router();
router.get("/", listRecentReviews);
export default router;
