import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("health endpoint is available without a database connection", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("CORS accepts the configured client origin without its trailing slash", async () => {
  const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: clientOrigin },
  });
  assert.equal(response.headers.get("access-control-allow-origin"), clientOrigin);
});

test("admin order management rejects unauthenticated requests", async () => {
  const response = await fetch(`${baseUrl}/orders`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    message: "Authentication is required.",
  });
});

test("admin API resources require administrator authentication", async () => {
  for (const resource of [
    "/admin/products",
    "/admin/orders",
    "/admin/users",
    "/admin/dashboard/metrics",
  ]) {
    const response = await fetch(`${baseUrl}${resource}`);
    assert.equal(response.status, 401, `${resource} should require an admin`);
  }
});

test("public checkout validates order details before accessing the database", async () => {
  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /customer details/);
});

test("public checkout rejects malformed order line items", async () => {
  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Store Customer",
      customerEmail: "customer@example.com",
      customerAddress: "1 Market Street",
      paymentMethod: "Cash on delivery",
      items: [null],
    }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /Order items/);
});

test("public checkout rejects unsupported payment methods", async () => {
  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Store Customer",
      customerEmail: "customer@example.com",
      customerAddress: "1 Market Street",
      paymentMethod: "Credit or debit card",
      items: [{ productId: "prod-1", quantity: 1 }],
    }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /only supported payment/);
});

test("customer session endpoint returns an empty session when signed out", async () => {
  const response = await fetch(`${baseUrl}/auth/customer`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user: null });
});

test("customer order history requires customer authentication", async () => {
  const response = await fetch(`${baseUrl}/orders/mine`);
  assert.equal(response.status, 401);
});

test("submitting a product review requires customer authentication", async () => {
  const response = await fetch(`${baseUrl}/products/prod-1/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 5, comment: "Looks great and fits well." }),
  });
  assert.equal(response.status, 401);
});

test("newsletter signup validates email without a database connection", async () => {
  const response = await fetch(`${baseUrl}/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /valid email/);
});

test("unknown API routes return a JSON 404", async () => {
  const response = await fetch(`${baseUrl}/unknown`);
  assert.equal(response.status, 404);
  assert.match((await response.json()).message, /Route not found/);
});
