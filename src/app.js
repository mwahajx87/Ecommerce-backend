import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { env } from "./config/env.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { publicOrderRouter } from "./routes/orderRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

export const app = express();

app.set("trust proxy", env.trustProxy || false);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    const error = new Error("Origin is not allowed by CORS");
    error.status = 403;
    callback(error);
  },
  credentials: true
}));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(mongoSanitize());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api", reviewRoutes);
app.use("/api/orders", publicOrderRouter);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin", requireAuth, requireRole("admin"), adminRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
