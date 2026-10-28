import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true },
  category: { type: String, required: true, trim: true },
  styles: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  sizes: { type: [String], default: [] },
  price: { type: Number, required: true, min: 0.01 },
  oldPrice: { type: Number, min: 0.01 },
  discount: { type: Number, default: 0, min: 0 },
  stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
  stockStatus: { type: String, enum: ["out_of_stock", "low_stock", "in_stock"], required: true },
  image: { type: String, required: true, trim: true },
  description: { type: String, default: "" }
}, { timestamps: true, id: false });

export const Product = mongoose.models.Product ?? mongoose.model("Product", productSchema);
