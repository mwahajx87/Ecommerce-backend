import { Router } from "express";
import {
  currentUser,
  customerSession,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import { isAdmin, optionalCustomer } from "../middleware/auth.js";

const router = Router();
router.post("/login", login);
router.post("/register", register);
router.get("/me", isAdmin, currentUser);
router.get("/customer", optionalCustomer, customerSession);
router.post("/logout", logout);
export default router;
