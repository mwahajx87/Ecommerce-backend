import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error(
    "Missing JWT_SECRET. From the repository root, copy .env.example to .env " +
    "(PowerShell: Copy-Item .env.example .env), then set JWT_SECRET to a unique random value of at least 32 characters."
  );
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/shopco"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  FRONTEND_ORIGINS: z.string().default("http://localhost:5173,http://localhost:5174"),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  SEED_ADMIN_NAME: z.string().default("Store Admin"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
}

export const env = {
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  mongoUri: parsed.data.MONGODB_URI,
  jwtSecret: parsed.data.JWT_SECRET,
  frontendOrigins: parsed.data.FRONTEND_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
  cookieSameSite: parsed.data.COOKIE_SAMESITE,
  trustProxy: parsed.data.TRUST_PROXY,
  seedAdminName: parsed.data.SEED_ADMIN_NAME,
  seedAdminEmail: parsed.data.SEED_ADMIN_EMAIL.toLowerCase(),
  seedAdminPassword: parsed.data.SEED_ADMIN_PASSWORD
};
