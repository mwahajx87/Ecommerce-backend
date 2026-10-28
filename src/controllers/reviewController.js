import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

export const listProductReviews = asyncHandler(async (req, res) => {
  const productExists = await Product.exists({ id: req.params.productId });
  if (!productExists) throw new HttpError(404, "Product not found.");

  const reviews = await Review.find({ productId: req.params.productId })
    .select("customerName rating comment createdAt")
    .sort({ createdAt: -1 })
    .lean();
  res.json(reviews);
});

export const saveProductReview = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, "A rating from 1 to 5 is required.");
  }
  if (comment.length < 10 || comment.length > 2000) {
    throw new HttpError(400, "Reviews must be between 10 and 2,000 characters.");
  }

  const productExists = await Product.exists({ id: req.params.productId });
  if (!productExists) throw new HttpError(404, "Product not found.");

  const review = await Review.findOneAndUpdate(
    { productId: req.params.productId, userId: req.user.id },
    {
      $set: {
        customerName: req.user.name,
        rating,
        comment,
      },
    },
    { new: true, upsert: true, runValidators: true },
  )
    .select("customerName rating comment createdAt")
    .lean();
  res.status(200).json(review);
});
