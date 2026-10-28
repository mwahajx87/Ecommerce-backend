import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listRecentReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .select("productId customerName rating comment createdAt")
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();
  const productIds = [...new Set(reviews.map((review) => review.productId))];
  const products = await Product.find({ id: { $in: productIds } })
    .select("id name")
    .lean();
  const productNames = new Map(
    products.map((product) => [product.id, product.name]),
  );
  res.json(
    reviews.map((review) => ({
      ...review,
      productName: productNames.get(review.productId) || "Store product",
    })),
  );
});
