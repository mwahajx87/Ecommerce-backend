import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  image: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  color: { type: String, default: "" },
  size: { type: String, default: "" }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  customerAddress: { type: String, required: true, trim: true },
  paymentMethod: { type: String, enum: ["Cash on delivery"], default: "Cash on delivery", required: true },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0 },
  shipping: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
    required: true
  },
  date: { type: String, required: true }
}, { timestamps: true });

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
