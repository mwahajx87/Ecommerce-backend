# SHOP.CO Backend API

Standalone REST API for the SHOP.CO website and admin panel. It does not host or build either frontend.

## Requirements

- Node.js 20+
- MongoDB (local MongoDB or Atlas)

## Setup

```sh
npm install
```

Create `.env` from the example (PowerShell: `Copy-Item .env.example .env`; Command Prompt: `copy .env.example .env`). Set a unique `JWT_SECRET` of at least 32 characters and set `SEED_ADMIN_PASSWORD` before seeding. Then run:

```sh
npm run seed
npm run dev
```

The API listens on port `5000` by default. `npm start` starts the production server, and `npm test` runs unit and HTTP tests that do not require a database.

Run the database-backed integration suite with `npm run test:integration`. It uses `mongodb-memory-server` and may download a MongoDB binary on its first run.

## Configuration

See [.env.example](./.env.example). `FRONTEND_ORIGINS` is a comma-separated CORS allow-list. For production, proxy each frontend's `/api/*` requests to this service and use `COOKIE_SAMESITE=lax`; direct cross-site requests require `COOKIE_SAMESITE=none` and HTTPS.

## API

All endpoints are under `/api`. Responses use JSON; errors have the shape `{ "message": "..." }`.

| Method | Path | Access |
|---|---|---|
| GET | `/api/health` | Public health check |
| POST | `/auth/register` | Public customer registration |
| POST | `/auth/login` | Public login; sets an httpOnly cookie |
| POST | `/auth/logout` | Clears session |
| GET | `/auth/customer` | Customer session |
| GET | `/auth/me` | Admin session |
| GET | `/products` | Product catalog |
| GET, POST | `/products/:id/reviews` | Public read; customer create |
| GET | `/reviews` | Recent reviews |
| POST | `/orders` | Guest or customer; server prices the order |
| GET | `/orders/mine` | Customer order history |
| POST | `/newsletter` | Public subscription |
| GET, POST | `/admin/products` | Admin catalog management |
| PUT, DELETE | `/admin/products/:id` | Admin catalog management |
| GET, POST | `/admin/orders` | Admin order management |
| PATCH, DELETE | `/admin/orders/:id` | Admin order management |
| GET | `/admin/users` | Admin user management |
| PATCH, DELETE | `/admin/users/:id` | Admin user management |
| GET | `/admin/dashboard/metrics` | Admin dashboard |

Order totals are calculated from current database prices: 5% tax and PKR 250 shipping for positive subtotals below PKR 5,000. Inventory is conditionally decremented and restored when an order is cancelled. Admin endpoints require an active admin account.

## Frontend deployment

Keep frontend builds in their own repositories. Configure a host rewrite from `/api/:path*` to `https://<BACKEND_HOST>/api/:path*` to keep cookies first-party. Configure `TRUST_PROXY` to match the deployment proxy count.
