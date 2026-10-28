import { Router } from "express";
import { getMetrics } from "../controllers/dashboardController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAdmin);
router.get("/metrics", getMetrics);
export default router;
