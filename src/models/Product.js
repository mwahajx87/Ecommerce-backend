import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: true, trim: true },
    styles: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    price: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0 },
    stockStatus: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      required: true,
    },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Product = mongoose.model("Product", productSchema);
