import { Counter } from "../models/Counter.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { adjustProductStock } from "./productService.js";
import { HttpError } from "../utils/httpError.js";

export function calculateOrderTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const shipping = subtotal > 0 && subtotal < 5000 ? 250 : 0;
  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}

async function nextOrderId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "order" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `ORD-PK-${counter.seq}`;
}

export async function createOrder({ input, customer }) {
  const requested = new Map();
  for (const item of input.items) {
    requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
  }

  const products = await Product.find({ id: { $in: [...requested.keys()] } });
  const productById = new Map(products.map((product) => [product.id, product]));
  for (const productId of requested.keys()) {
    if (!productById.has(productId)) {
      throw new HttpError(400, `Product ${productId} was not found`);
    }
  }
  for (const [productId, quantity] of requested) {
    const product = productById.get(productId);
    if (quantity > product.stock) {
      throw new HttpError(409, `Not enough stock for ${product.name}`);
    }
  }

  const decremented = [];
  try {
    for (const [productId, quantity] of requested) {
      const product = productById.get(productId);
      const updated = await adjustProductStock(productId, -quantity);
      if (!updated) {
        throw new HttpError(409, `Not enough stock for ${product.name}`);
      }
      decremented.push({ productId, quantity, stock: updated.stock });
    }

    const items = input.items.map((item) => {
      const product = productById.get(item.productId);
      return {
        productId: product.id,
        productName: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
        color: item.color ?? "",
        size: item.size ?? ""
      };
    });
    const totals = calculateOrderTotals(items);
    const createdAt = new Date();
    const order = await Order.create({
      id: await nextOrderId(),
      customer: customer?._id,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerAddress: input.customerAddress,
      paymentMethod: "Cash on delivery",
      items,
      ...totals,
      date: createdAt.toISOString().slice(0, 10),
      createdAt
    });
    return order;
  } catch (error) {
    for (const item of decremented.reverse()) {
      await adjustProductStock(item.productId, item.quantity);
    }
    throw error;
  }
}

export async function cancelOrder(orderId) {
  const order = await Order.findOneAndUpdate(
    { id: orderId, status: { $ne: "Cancelled" } },
    { $set: { status: "Cancelled" } },
    { new: true }
  );
  if (!order) {
    const existing = await Order.findOne({ id: orderId });
    if (!existing) throw new HttpError(404, "Order not found");
    return { order: existing, cancelled: false };
  }

  for (const [productId, quantity] of aggregateOrderItems(order.items)) {
    await adjustProductStock(productId, quantity);
  }
  return { order, cancelled: true };
}

function aggregateOrderItems(items) {
  const totals = new Map();
  for (const item of items) {
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  }
  return totals;
}
