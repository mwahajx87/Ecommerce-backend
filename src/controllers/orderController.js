import { Order } from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeOrder } from "../utils/serialize.js";
import { createOrder, cancelOrder } from "../services/orderService.js";
import { HttpError } from "../utils/httpError.js";

export const placeOrder = asyncHandler(async (req, res) => {
  const customer = req.user?.role === "customer" ? req.user : undefined;
  const order = await createOrder({ input: req.body, customer });
  res.status(201).json(serializeOrder(order));
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
  res.json(orders.map((order) => ({
    id: order.id,
    date: order.date,
    status: order.status,
    total: order.total,
    items: order.items
  })));
});

export const listAdminOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders.map(serializeOrder));
});

export const createAdminOrder = asyncHandler(async (req, res) => {
  const order = await createOrder({ input: req.body });
  res.status(201).json(serializeOrder(order));
});

export const updateAdminOrder = asyncHandler(async (req, res) => {
  if (req.body.status === "Cancelled") {
    const result = await cancelOrder(req.params.id);
    res.json(serializeOrder(result.order));
    return;
  }
  const order = await Order.findOneAndUpdate(
    { id: req.params.id, status: { $ne: "Cancelled" } },
    { $set: { status: req.body.status } },
    { new: true, runValidators: true }
  );
  if (order) {
    res.json(serializeOrder(order));
    return;
  }
  const existing = await Order.exists({ id: req.params.id });
  if (!existing) throw new HttpError(404, "Order not found");
  throw new HttpError(409, "A cancelled order cannot be reopened");
});

export const deleteAdminOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndDelete({ id: req.params.id });
  if (!order) throw new HttpError(404, "Order not found");
  res.status(204).end();
});
