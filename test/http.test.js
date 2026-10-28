import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-that-is-long-enough-123";
process.env.FRONTEND_ORIGINS = "http://localhost:5173";

const integrationTest = process.env.RUN_DB_INTEGRATION === "true" ? test : test.skip;
let app;
let mongoose;
let mongoServer;
let models;
let bcrypt;

before(async () => {
  if (process.env.RUN_DB_INTEGRATION !== "true") return;
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  mongoServer = await MongoMemoryServer.create();
  mongoose = (await import("mongoose")).default;
  await mongoose.connect(mongoServer.getUri());
  app = (await import("../src/app.js")).app;
  models = await Promise.all([
    import("../src/models/User.js"),
    import("../src/models/Product.js"),
    import("../src/models/Order.js"),
    import("../src/models/Review.js"),
    import("../src/models/Subscriber.js"),
    import("../src/models/Counter.js")
  ]);
  bcrypt = (await import("bcryptjs")).default;
  await Promise.all(models.map(({ User, Product, Order, Review, Subscriber, Counter }) => {
    const model = User ?? Product ?? Order ?? Review ?? Subscriber ?? Counter;
    return model?.init();
  }));
});

after(async () => {
  if (process.env.RUN_DB_INTEGRATION !== "true") return;
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  if (process.env.RUN_DB_INTEGRATION !== "true") return;
  await Promise.all(models.map(({ User, Product, Order, Review, Subscriber, Counter }) => {
    const model = User ?? Product ?? Order ?? Review ?? Subscriber ?? Counter;
    return model?.deleteMany({});
  }));
});

function sessionCookie(response) {
  return response.headers["set-cookie"][0].split(";")[0];
}

async function createAdminSession() {
  const { User } = await import("../src/models/User.js");
  await User.create({
    name: "Store Admin",
    email: "admin@example.com",
    passwordHash: await bcrypt.hash("admin-password-123", 10),
    role: "admin",
    status: "Active"
  });
  const response = await (await import("supertest")).default(app)
    .post("/api/auth/login")
    .send({ email: "admin@example.com", password: "admin-password-123" })
    .expect(200);
  return sessionCookie(response);
}

integrationTest("health and unknown paths are JSON API responses", async () => {
  const request = (await import("supertest")).default;
  await request(app).get("/api/health").expect(200, { status: "ok" });
  await request(app).get("/not-api").expect(404).expect(({ body }) => {
    assert.equal(body.message, "Not found");
  });
});

integrationTest("register, session, and role-protected admin routes work", async () => {
  const request = (await import("supertest")).default;
  const registered = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test Customer", email: "customer@example.com", password: "password-123" })
    .expect(201);
  assert.equal(registered.body.user.role, "customer");
  assert.equal("passwordHash" in registered.body.user, false);
  const customerCookie = sessionCookie(registered);
  await request(app).get("/api/auth/customer").set("Cookie", customerCookie).expect(200);
  await request(app).get("/api/admin/users").set("Cookie", customerCookie).expect(403);
  await request(app).get("/api/admin/users").expect(401);

  const adminCookie = await createAdminSession();
  const adminSession = await request(app).get("/api/auth/me").set("Cookie", adminCookie).expect(200);
  assert.equal(adminSession.body.user.role, "admin");
  await request(app).post("/api/auth/logout").set("Cookie", adminCookie).expect(204);
});

integrationTest("order pricing uses database prices and cancellation restores stock only once", async () => {
  const request = (await import("supertest")).default;
  const { Product } = await import("../src/models/Product.js");
  await Product.create({
    id: "prod-test",
    name: "Test Product",
    sku: "TEST-001",
    category: "Fashion",
    price: 1000,
    stock: 8,
    stockStatus: "low_stock",
    image: "https://example.com/product.jpg"
  });
  const orderResponse = await request(app).post("/api/orders").send({
    customerName: "Guest Buyer",
    customerEmail: "buyer@example.com",
    customerAddress: "1 Test Street",
    subtotal: 1,
    tax: 0,
    shipping: 0,
    total: 1,
    items: [{ productId: "prod-test", quantity: 2, price: 1 }]
  }).expect(201);
  const order = orderResponse.body;
  assert.equal(order.subtotal, 2000);
  assert.equal(order.tax, 100);
  assert.equal(order.shipping, 250);
  assert.equal(order.total, 2350);
  assert.equal(order.items[0].price, 1000);
  assert.equal((await Product.findOne({ id: "prod-test" })).stock, 6);

  const cookie = await createAdminSession();
  await request(app).patch(`/api/admin/orders/${order.id}`)
    .set("Cookie", cookie)
    .send({ status: "Cancelled" })
    .expect(200);
  await request(app).patch(`/api/admin/orders/${order.id}`)
    .set("Cookie", cookie)
    .send({ status: "Cancelled" })
    .expect(200);
  assert.equal((await Product.findOne({ id: "prod-test" })).stock, 8);

  const insufficient = await request(app).post("/api/orders").send({
    customerName: "Guest Buyer",
    customerEmail: "buyer@example.com",
    customerAddress: "1 Test Street",
    items: [{ productId: "prod-test", quantity: 9 }]
  }).expect(409);
  assert.match(insufficient.body.message, /Test Product/);
});

integrationTest("product derived fields, newsletter idempotency, and CORS allow-list", async () => {
  const request = (await import("supertest")).default;
  const cookie = await createAdminSession();
  const product = await request(app).post("/api/admin/products")
    .set("Cookie", cookie)
    .send({
      id: "prod-derived",
      name: "Derived Product",
      sku: "DER-001",
      category: "Electronics",
      price: 80,
      oldPrice: 100,
      discount: 99,
      stock: 0,
      stockStatus: "in_stock",
      image: "https://example.com/derived.jpg"
    })
    .expect(201);
  assert.equal(product.body.discount, 20);
  assert.equal(product.body.stockStatus, "out_of_stock");

  await request(app).post("/api/newsletter").send({ email: "news@example.com" }).expect(201);
  const duplicate = await request(app).post("/api/newsletter").send({ email: "NEWS@example.com" }).expect(200);
  assert.match(duplicate.body.message, /already subscribed/i);

  await request(app).get("/api/health").set("Origin", "http://localhost:5173")
    .expect(200)
    .expect("Access-Control-Allow-Origin", "http://localhost:5173");
  await request(app).get("/api/health").set("Origin", "https://not-allowed.example").expect(403);
});
