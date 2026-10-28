import { randomUUID } from "node:crypto";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const stockStatusFor = (stock) =>
  stock === 0 ? "out_of_stock" : stock <= 10 ? "low_stock" : "in_stock";
const allowedStyles = new Set(["casual", "formal", "party", "gym"]);

const productOptions = (options, fieldName) => {
  if (!Array.isArray(options)) return [];
  const values = [...new Set(options.map((value) => String(value).trim()).filter(Boolean))];
  if (values.length > 20 || values.some((value) => value.length > 50)) {
    throw new HttpError(400, `${fieldName} must contain at most 20 values of 50 characters each.`);
  }
  return values;
};

const productInput = (body) => {
  const name = String(body.name || "").trim();
  const sku = String(body.sku || "").trim();
  const category = String(body.category || "").trim();
  const rawStyles = Array.isArray(body.styles)
    ? body.styles.map((style) => String(style).trim().toLowerCase()).filter(Boolean)
    : [];
  if (rawStyles.some((style) => !allowedStyles.has(style))) {
    throw new HttpError(400, "Product styles must be casual, formal, party, or gym.");
  }
  const styles = [...new Set(rawStyles)];
  const colors = productOptions(body.colors, "Colors");
  const sizes = productOptions(body.sizes, "Sizes");
  const price = Number(body.price);
  const stock = Number(body.stock);
  if (!name || !sku || !category || !Number.isFinite(price) || price <= 0) {
    throw new HttpError(400, "Name, SKU, category, and a valid price are required.");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new HttpError(400, "Stock must be a non-negative whole number.");
  }
  return {
    name,
    sku,
    category,
    styles,
    colors,
    sizes,
    price,
    stock,
    stockStatus: stockStatusFor(stock),
    image: String(body.image || ""),
    description: String(body.description || ""),
  };
};

export const listProducts = asyncHandler(async (req, res) => {
  res.json(await Product.find().sort({ createdAt: -1 }).lean());
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    id: `prod-${randomUUID()}`,
    ...productInput(req.body),
  });
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { id: req.params.id },
    productInput(req.body),
    { new: true, runValidators: true },
  ).lean();
  if (!product) throw new HttpError(404, "Product not found.");
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ id: req.params.id });
  if (!product) throw new HttpError(404, "Product not found.");
  res.status(204).end();
});
