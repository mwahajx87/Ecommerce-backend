import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMetrics = asyncHandler(async (req, res) => {
  const [revenueResult, orders, products, activeUsers, monthlyRows, categoryRows] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, revenue: { $sum: "$total" } } }
    ]),
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments({ status: "Active" }),
    Order.aggregate([
      { $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: monthsAgo(11) } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$total" }
        }
      }
    ]),
    Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }])
  ]);

  const monthlySales = [];
  const now = new Date();
  for (let offset = 11; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const row = monthlyRows.find((item) => item._id.year === monthDate.getFullYear() && item._id.month === monthDate.getMonth() + 1);
    monthlySales.push({
      month: monthDate.toLocaleString("en", { month: "short" }),
      revenue: row?.revenue ?? 0
    });
  }

  const totalProducts = categoryRows.reduce((sum, item) => sum + item.count, 0);
  const categoryBreakdown = categoryRows.map((item) => ({
    name: item._id,
    value: totalProducts ? Math.round(item.count / totalProducts * 100) : 0
  }));
  res.json({
    revenue: revenueResult[0]?.revenue ?? 0,
    orders,
    products,
    activeUsers,
    monthlySales,
    categoryBreakdown
  });
});

function monthsAgo(monthCount) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - monthCount);
  date.setHours(0, 0, 0, 0);
  return date;
}
