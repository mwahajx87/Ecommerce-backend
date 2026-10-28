import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout, currentUser } from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validation/schemas.js";

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." }
});

router.post("/register", validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/customer", requireAuth, requireRole("customer"), currentUser);
router.get("/me", requireAuth, requireRole("admin"), currentUser);

export default router;
