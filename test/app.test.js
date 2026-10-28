import test, { before } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-that-is-long-enough-123";
process.env.FRONTEND_ORIGINS = "http://localhost:5173";

let app;
let request;

before(async () => {
  app = (await import("../src/app.js")).app;
  request = (await import("supertest")).default;
});

test("health and unknown paths return JSON", async () => {
  await request(app).get("/api/health").expect(200, { status: "ok" });
  await request(app).get("/unknown").expect(404).expect(({ body }) => {
    assert.equal(body.message, "Not found");
  });
});

test("CORS accepts only configured origins", async () => {
  await request(app).get("/api/health")
    .set("Origin", "http://localhost:5173")
    .expect(200)
    .expect("Access-Control-Allow-Origin", "http://localhost:5173");
  await request(app).get("/api/health")
    .set("Origin", "https://not-allowed.example")
    .expect(403);
});

test("admin API rejects unauthenticated callers and registration validates input", async () => {
  await request(app).get("/api/admin/users").expect(401);
  await request(app).post("/api/auth/register")
    .send({ name: "Customer", email: "customer@example.com", password: "short" })
    .expect(400);
});
