import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function serializeReview(review) {
  return {
    _id: review._id,
    productName: review.productName,
    customerName: review.customerName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt
  };
}

export const listProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) throw new HttpError(404, "Product not found");
  const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });
  res.json(reviews.map(serializeReview));
});

export const createProductReview = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) throw new HttpError(404, "Product not found");
  const review = await Review.create({
    product: product._id,
    productName: product.name,
    customer: req.user._id,
    customerName: req.user.name,
    rating: req.body.rating,
    comment: req.body.comment
  });
  res.status(201).json(serializeReview(review));
});

export const listRecentReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(10);
  res.json(reviews.map(serializeReview));
});
