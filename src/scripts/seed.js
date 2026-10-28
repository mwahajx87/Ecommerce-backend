import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import {
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
} from "../../../Admin-panel-E-commerce-Dashboad-/src/data/mockData.js";

const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "";

if (!adminEmail || adminPassword.length < 12) {
  throw new Error(
    "Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in backend/.env before seeding.",
  );
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Set JWT_SECRET to at least 32 characters in backend/.env.");
}

await connectDatabase();

const passwordHash = await bcrypt.hash(adminPassword, 12);
const seedUsers = INITIAL_USERS.map((user) => ({
  ...user,
  email: user.id === "usr-1" ? adminEmail : user.email,
  ...(user.id === "usr-1" ? { name: process.env.ADMIN_NAME || user.name } : {}),
}));
const admin = seedUsers.find((user) => user.id === "usr-1");

await User.updateOne(
  { id: admin.id },
  { $set: { ...admin, role: "admin", passwordHash } },
  { upsert: true },
);

for (const user of seedUsers.filter((item) => item.id !== admin.id)) {
  await User.updateOne(
    { id: user.id },
    {
      $setOnInsert: {
        ...user,
        role: "customer",
        passwordHash: await bcrypt.hash(randomUUID(), 12),
      },
    },
    { upsert: true },
  );
}

for (const product of INITIAL_PRODUCTS) {
  await Product.updateOne(
    { id: product.id },
    { $setOnInsert: product },
    { upsert: true },
  );
  await Product.updateOne(
    { id: product.id, styles: { $exists: false } },
    { $set: { styles: product.styles || [] } },
  );
}
for (const order of INITIAL_ORDERS) {
  await Order.updateOne(
    { id: order.id },
    { $setOnInsert: order },
    { upsert: true },
  );
}

console.log(`Seeded demo data. Admin login email: ${adminEmail}`);
process.exit(0);
