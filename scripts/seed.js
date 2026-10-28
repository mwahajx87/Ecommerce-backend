import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { User } from "../src/models/User.js";
import { Product } from "../src/models/Product.js";
import { deriveProductFields } from "../src/services/productService.js";

const sampleProducts = [
  { id: "prod-pk-lawn-suit", name: "Embroidered Lawn Suit", sku: "PK-FASH-001", category: "Fashion", styles: ["casual", "formal"], colors: ["Ivory", "Sage"], sizes: ["S", "M", "L"], price: 3499, oldPrice: 4200, stock: 18, image: "https://images.unsplash.com/photo-1583391733956-6c78276477e7", description: "Lightweight embroidered lawn outfit." },
  { id: "prod-pk-kurta", name: "Classic Cotton Kurta", sku: "PK-FASH-002", category: "Fashion", styles: ["casual", "formal"], colors: ["White", "Navy"], sizes: ["S", "M", "L", "XL"], price: 2200, stock: 24, image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10", description: "Everyday cotton kurta with a clean finish." },
  { id: "prod-pk-khussa", name: "Leather Khussa", sku: "PK-FASH-003", category: "Fashion", styles: ["formal", "party"], colors: ["Tan", "Black"], sizes: ["40", "41", "42", "43"], price: 2800, oldPrice: 3200, stock: 9, image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519", description: "Traditional leather footwear." },
  { id: "prod-pk-lamp", name: "Handcrafted Table Lamp", sku: "PK-HOME-001", category: "Home & Living", styles: [], colors: ["Natural"], sizes: [], price: 4650, stock: 12, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c", description: "Hand-finished accent lamp for a warm interior." },
  { id: "prod-pk-cushion", name: "Ajrak Cushion Cover", sku: "PK-HOME-002", category: "Home & Living", styles: [], colors: ["Red", "Indigo"], sizes: ["18 x 18"], price: 950, stock: 30, image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2", description: "Printed cushion cover inspired by traditional patterns." },
  { id: "prod-pk-earbuds", name: "Wireless Earbuds", sku: "PK-ELEC-001", category: "Electronics", styles: [], colors: ["Black", "White"], sizes: [], price: 5999, oldPrice: 6999, stock: 14, image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1", description: "Compact wireless earbuds with charging case." },
  { id: "prod-pk-watch", name: "Digital Sports Watch", sku: "PK-ELEC-002", category: "Electronics", styles: ["gym"], colors: ["Black"], sizes: [], price: 4250, stock: 7, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30", description: "Water-resistant digital watch for everyday wear." },
  { id: "prod-pk-honey", name: "Northern Blossom Honey", sku: "PK-GROC-001", category: "Groceries", styles: [], colors: [], sizes: ["500g"], price: 1800, stock: 22, image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924", description: "Small-batch honey sourced from northern Pakistan." }
];

try {
  if (!env.seedAdminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD is required to seed the admin account");
  }
  await connectDatabase();

  const existingAdmin = await User.exists({ email: env.seedAdminEmail });
  if (!existingAdmin) {
    await User.create({
      name: env.seedAdminName,
      email: env.seedAdminEmail,
      passwordHash: await bcrypt.hash(env.seedAdminPassword, 12),
      role: "admin",
      status: "Active",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(env.seedAdminName)}`
    });
    console.log(`Created admin account: ${env.seedAdminEmail}`);
  } else {
    console.log(`Admin account already exists: ${env.seedAdminEmail}`);
  }

  for (const product of sampleProducts) {
    if (!(await Product.exists({ sku: product.sku }))) {
      await Product.create(deriveProductFields(product));
    }
  }
  console.log(`Seeded catalog (${sampleProducts.length} sample products available).`);
} catch (error) {
  console.error("Seeding failed", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
