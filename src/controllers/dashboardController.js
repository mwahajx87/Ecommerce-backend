import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const formatMonth = (date) =>
  new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date);

export const getMetrics = asyncHandler(async (req, res) => {
  const [orders, products, activeUsers] = await Promise.all([
    Order.find().sort({ date: 1 }).lean(),
    Product.find().select("id category").lean(),
    User.countDocuments({ role: "customer", status: "Active" }),
  ]);
  const revenue = orders.reduce(
    (sum, order) =>
      order.status === "Cancelled" ? sum : sum + (order.total || 0),
    0,
  );
  const months = Array.from({ length: 9 }, (_, index) => {
    const date = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 8 + index, 1),
    );
    return {
      month: formatMonth(date),
      revenue: 0,
      orders: 0,
      monthKey: date.toISOString().slice(0, 7),
    };
  });
  const monthMap = new Map(months.map((month) => [month.monthKey, month]));
  const productCategories = new Map(products.map((item) => [item.id, item.category]));
  const categorySales = new Map();

  for (const order of orders) {
    if (order.status === "Cancelled") continue;
    const month = monthMap.get(String(order.date).slice(0, 7));
    if (month) {
      month.revenue += order.total || 0;
      month.orders += 1;
    }
    for (const item of order.items) {
      const category = productCategories.get(item.productId) || "Other";
      categorySales.set(
        category,
        (categorySales.get(category) || 0) + item.price * item.quantity,
      );
    }
  }

  const categoryTotal = Array.from(categorySales.values()).reduce(
    (sum, value) => sum + value,
    0,
  );
  const colors = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899"];
  const categoryBreakdown = Array.from(categorySales, ([name, value], index) => ({
    name,
    value: categoryTotal ? Math.round((value / categoryTotal) * 100) : 0,
    color: colors[index % colors.length],
  }));
  if (categoryBreakdown.length && categoryTotal) {
    const sum = categoryBreakdown.reduce((total, item) => total + item.value, 0);
    categoryBreakdown[0].value += 100 - sum;
  }

  res.json({
    revenue,
    orders: orders.length,
    activeUsers,
    products: products.length,
    monthlySales: months.map(({ month, revenue: monthRevenue, orders: count }) => ({
      month,
      revenue: monthRevenue,
      orders: count,
    })),
    categoryBreakdown,
  });
});
