import { randomUUID } from "node:crypto";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export const listOrders = asyncHandler(async (req, res) => {
  res.json(await Order.find().sort({ createdAt: -1 }).lean());
});

export const listCustomerOrders = asyncHandler(async (req, res) => {
  res.json(
    await Order.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .lean(),
  );
});

export const createOrder = asyncHandler(async (req, res) => {
  const { customerName, customerEmail, customerAddress, paymentMethod } =
    req.body;
  const requestedItems = req.body.items;
  if (
    !String(customerName || "").trim() ||
    String(customerName).trim().length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail || "")) ||
    String(customerEmail).trim().length > 254 ||
    !String(customerAddress || "").trim() ||
    String(customerAddress).trim().length > 500 ||
    !String(paymentMethod || "").trim() ||
    String(paymentMethod).trim().length > 80 ||
    !Array.isArray(requestedItems) ||
    requestedItems.length === 0 ||
    requestedItems.length > 100
  ) {
    throw new HttpError(400, "Valid customer details and at least one item are required.");
  }
  if (String(paymentMethod).trim() !== "Cash on delivery") {
    throw new HttpError(
      400,
      "Cash on delivery is the only supported payment method.",
    );
  }

  const quantities = new Map();
  for (const item of requestedItems) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new HttpError(400, "Order items need a product ID and positive whole quantity.");
    }
    const quantity = Number(item.quantity);
    const productId = String(item.productId || "").trim();
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError(400, "Order items need a product ID and positive whole quantity.");
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const reservedProducts = [];
  try {
    const productsById = new Map();
    for (const [productId, quantity] of quantities) {
      const product = await Product.findOneAndUpdate(
        { id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );
      if (!product) {
        const exists = await Product.exists({ id: productId });
        throw new HttpError(
          exists ? 409 : 404,
          exists
            ? "There is not enough stock to fulfill this order."
            : `Product ${productId} was not found.`,
        );
      }
      reservedProducts.push({ productId, quantity });
      product.stockStatus =
        product.stock === 0
          ? "out_of_stock"
          : product.stock <= 10
            ? "low_stock"
            : "in_stock";
      await product.save();
      productsById.set(productId, product);
    }

    const items = requestedItems.map((requestedItem) => {
      const product = productsById.get(String(requestedItem.productId).trim());
      return {
        productId: product.id,
        productName: product.name,
        quantity: Number(requestedItem.quantity),
        price: product.price,
        image: product.image,
        color: String(requestedItem.color || "").trim(),
        size: String(requestedItem.size || "").trim(),
      };
    });
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const tax = Math.round(subtotal * 0.05);
    const shipping = subtotal === 0 || subtotal >= 5000 ? 0 : 250;
    const order = await Order.create({
      id: `ORD-PK-${Date.now()}-${randomUUID().slice(0, 8)}`,
      customerName:
        req.user?.role === "customer"
          ? req.user.name
          : String(customerName).trim(),
      customerEmail:
        req.user?.role === "customer"
          ? req.user.email
          : String(customerEmail).trim().toLowerCase(),
      customerAddress: String(customerAddress).trim(),
      date: new Date().toISOString().slice(0, 10),
      items,
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping,
      paymentMethod: String(paymentMethod).trim(),
      status: "Pending",
      ...(req.user?.role === "customer" ? { customerId: req.user.id } : {}),
    });
    res.status(201).json(order);
  } catch (error) {
    await Promise.all(
      reservedProducts.map(async ({ productId, quantity }) => {
        const product = await Product.findOneAndUpdate(
          { id: productId },
          { $inc: { stock: quantity } },
          { new: true },
        );
        if (product) {
          product.stockStatus =
            product.stock === 0
              ? "out_of_stock"
              : product.stock <= 10
                ? "low_stock"
                : "in_stock";
          await product.save();
        }
      }),
    );
    throw error;
  }
});

export const updateOrder = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!orderStatuses.includes(status)) {
    throw new HttpError(400, "A valid order status is required.");
  }
  const order = await Order.findOneAndUpdate(
    { id: req.params.id },
    { status },
    { new: true, runValidators: true },
  ).lean();
  if (!order) throw new HttpError(404, "Order not found.");
  res.json(order);
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndDelete({ id: req.params.id });
  if (!order) throw new HttpError(404, "Order not found.");
  res.status(204).end();
});
