import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
  comment: { type: String, required: true, trim: true }
}, { timestamps: true });

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ createdAt: -1 });

export const Review = mongoose.models.Review ?? mongoose.model("Review", reviewSchema);
