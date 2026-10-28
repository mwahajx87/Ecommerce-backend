import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const productId = z.string().trim().min(1).max(100);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password: z.string().min(8).max(128)
}).strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128)
}).strict();

export const productSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(100),
  category: z.enum(["Fashion", "Home & Living", "Electronics", "Groceries"]),
  styles: z.array(z.string().trim().toLowerCase()).default([]),
  colors: z.array(z.string().trim()).default([]),
  sizes: z.array(z.string().trim()).default([]),
  price: z.number().positive(),
  oldPrice: z.number().positive().nullable().optional(),
  discount: z.number().nonnegative().optional(),
  stock: z.number().int().min(0),
  stockStatus: z.string().max(32).optional(),
  image: z.string().trim().url().max(2048),
  description: z.string().max(5000).default("")
}).strict();

export const productUpdateSchema = productSchema.omit({ id: true }).partial().strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const orderSchema = z.object({
  customerName: z.string().trim().min(1).max(150),
  customerEmail: email,
  customerAddress: z.string().trim().min(1).max(1000),
  paymentMethod: z.literal("Cash on delivery").optional(),
  subtotal: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  shipping: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  items: z.array(z.object({
    productId,
    quantity: z.number().int().positive(),
    price: z.number().nonnegative().optional(),
    productName: z.string().max(200).optional(),
    image: z.string().max(2048).optional(),
    color: z.string().max(100).optional(),
    size: z.string().max(100).optional()
  }).strict()).min(1).max(100)
}).strict();

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(3000)
}).strict();

export const newsletterSchema = z.object({ email }).strict();
export const orderStatusSchema = z.object({
  status: z.enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"])
}).strict();
export const userUpdateSchema = z.object({
  role: z.enum(["admin", "customer"]).optional(),
  status: z.enum(["Active", "Suspended"]).optional()
}).strict().refine((value) => value.role !== undefined || value.status !== undefined, "At least one field is required");
