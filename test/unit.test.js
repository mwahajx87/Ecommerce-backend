import test from "node:test";
import assert from "node:assert/strict";
import { calculateOrderTotals } from "../src/services/orderService.js";
import { deriveProductFields, getStockStatus } from "../src/services/productService.js";
import { orderSchema, registerSchema } from "../src/validation/schemas.js";

test("order totals enforce tax rounding and shipping threshold", () => {
  assert.deepEqual(calculateOrderTotals([{ price: 1000, quantity: 2 }]), {
    subtotal: 2000,
    tax: 100,
    shipping: 250,
    total: 2350
  });
  assert.deepEqual(calculateOrderTotals([{ price: 5000, quantity: 1 }]), {
    subtotal: 5000,
    tax: 250,
    shipping: 0,
    total: 5250
  });
});

test("product discount and stock status are derived from canonical values", () => {
  assert.deepEqual(
    (({ discount, stockStatus }) => ({ discount, stockStatus }))(
      deriveProductFields({ price: 80, oldPrice: 100, stock: 10 })
    ),
    { discount: 20, stockStatus: "low_stock" }
  );
  assert.equal(getStockStatus(0), "out_of_stock");
  assert.equal(getStockStatus(11), "in_stock");
});

test("request schemas normalize emails and reject malformed input", () => {
  const registered = registerSchema.parse({
    name: "Customer",
    email: " CUSTOMER@example.com ",
    password: "password-123"
  });
  assert.equal(registered.email, "customer@example.com");
  assert.equal(registerSchema.safeParse({
    name: "Customer",
    email: "customer@example.com",
    password: "short"
  }).success, false);

  assert.equal(orderSchema.safeParse({
    customerName: "Buyer",
    customerEmail: "buyer@example.com",
    customerAddress: "1 Main Street",
    items: [{ productId: "prod-1", quantity: 1, price: 0.01 }]
  }).success, true);
});
