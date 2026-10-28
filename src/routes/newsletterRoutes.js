import { Router } from "express";
import { subscribe } from "../controllers/newsletterController.js";
import { validate } from "../middleware/validate.js";
import { newsletterSchema } from "../validation/schemas.js";

const router = Router();
router.post("/", validate(newsletterSchema), subscribe);

export default router;
