import { randomUUID } from "node:crypto";
import { Product } from "../models/Product.js";
import { HttpError } from "../utils/httpError.js";

export function getStockStatus(stock) {
  if (stock === 0) return "out_of_stock";
  if (stock <= 10) return "low_stock";
  return "in_stock";
}

export function deriveProductFields(input) {
  const discount = input.oldPrice && input.oldPrice > input.price
    ? Math.round((input.oldPrice - input.price) / input.oldPrice * 100)
    : 0;
  return { ...input, discount, stockStatus: getStockStatus(input.stock) };
}

export function adjustProductStock(id, quantityChange) {
  const filter = { id };
  if (quantityChange < 0) {
    filter.stock = { $gte: Math.abs(quantityChange) };
  }
  return Product.findOneAndUpdate(
    filter,
    [
      { $set: { stock: { $add: ["$stock", quantityChange] } } },
      {
        $set: {
          stockStatus: {
            $switch: {
              branches: [
                { case: { $eq: ["$stock", 0] }, then: "out_of_stock" },
                { case: { $lte: ["$stock", 10] }, then: "low_stock" }
              ],
              default: "in_stock"
            }
          }
        }
      }
    ],
    { new: true }
  );
}

export async function createProduct(input) {
  const id = input.id && !(await Product.exists({ id: input.id }))
    ? input.id
    : `prod-${randomUUID()}`;
  return Product.create(deriveProductFields({ ...input, id }));
}

export async function updateProduct(id, input) {
  const product = await Product.findOne({ id });
  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  Object.assign(product, input);
  Object.assign(product, deriveProductFields(product.toObject()));
  await product.save();
  return product;
}
