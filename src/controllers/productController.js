import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeProduct } from "../utils/serialize.js";
import { createProduct, updateProduct } from "../services/productService.js";
import { HttpError } from "../utils/httpError.js";

export const listProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products.map(serializeProduct));
});

export const listAdminProducts = listProducts;

export const createAdminProduct = asyncHandler(async (req, res) => {
  const product = await createProduct(req.body);
  res.status(201).json(serializeProduct(product));
});

export const updateAdminProduct = asyncHandler(async (req, res) => {
  const product = await updateProduct(req.params.id, req.body);
  res.json(serializeProduct(product));
});

export const deleteAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ id: req.params.id });
  if (!product) throw new HttpError(404, "Product not found");
  res.status(204).end();
});
