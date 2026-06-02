# Copilot Instructions — Bryge Platform

Purpose
- Provide Copilot with a condensed, comprehensive guide to the project's business logic, architecture, conventions, runtime configuration, and priorities so code suggestions and edits are aligned with product intent.

Project Overview
- Bryge is a multi-vendor cross-border e-commerce marketplace connecting Nigerian vendors with diaspora buyers.
- Key flows: vendor onboarding, product listing, multi-vendor checkout (order splitting), escrow-managed payments, admin-managed delivery lifecycle, vendor payouts in Naira.

Core Business Rules & Domain Concepts
- Roles: `customer`, `vendor`, `admin`, `sub_admin`.
- Vendor application life cycle: pending → active → suspended/rejected.
- Multi-vendor orders: one parent `orders` record + one `vendor_orders` per vendor group. Customer sees unified order, vendors see only their sub-order.
- Escrow: Bryge holds customer funds; `escrow_transactions` records created on payment (`holding`), moved to `released` or `refunded` on delivery or dispute resolution. Vendor balances tracked via `vendor_profiles.on_hold_balance` and `available_balance`.
- 72-hour auto-release: after `delivered` and no dispute within 72 hours, escrow is released to vendor automatically (cron job to implement).
- Commission: snapshot the category commission rate at product creation; vendor payout = subtotal - commission.

Architecture & Tech Stack
- Frontend: React + Vite. Dev port 5173. Proxy `/api` → `http://localhost:5000`.
- Backend: Node.js + Express 5. Entry: `backend/src/index.js`.
- Database: PostgreSQL 17. DB access via `backend/src/config/database.js` (pg). Migrations in `backend/src/database/migrations`.
- Image storage: Cloudinary helper in `backend/src/config/cloudinary.js`.
- Auth: JWT access + refresh, bcryptjs for hashing. Helpers in `backend/src/utils/jwt.js`.
- Email: Resend API / nodemailer. Templates in `backend/src/utils/email.js`.
- Payments: Paystack (NGN), Stripe (USD), PayPal (USD). Mock payment functions exist in `order.controller.js` for development.

Repository Layout (high level)
- `backend/` — Express API, controllers, routes, middleware, config, database migrations.
  - `src/controllers/` — business logic per domain (auth, product, vendor, order, admin, etc.)
  - `src/routes/` — route registration. See `backend/src/routes/index.js`.
  - `src/middleware/` — `auth.js`, `upload.js`, `validate.js`, `errorHandler.js`.
  - `src/database/migrate.js` and `migrations/` — SQL migrations.
- `frontend/` — React app (Vite). Key contexts: AuthContext, CartContext. Pages grouped by role (admin, vendor, auth, shop, orders).
- `docs/DESIGN.md` — canonical design and product rules (source for this instruction file).

Database Schema Highlights
- `users`, `vendor_profiles`, `admin_profiles`, `categories`, `products`, `orders`, `vendor_orders`, `order_items`, `payments`, `escrow_transactions`, `wallet_transactions`, `payout_requests`, `disputes`, `cart_items`, `reviews`, `notifications`.
- Important columns:
  - `products.commission_rate` (snapshotted)
  - `vendor_profiles.on_hold_balance`, `available_balance`, `total_earned`
  - `orders.currency`, `payment_method`, `payment_reference`

API Endpoints (summary)
- Auth: `/api/auth/*` — register, verify-email (OTP), login, admin/login, refresh, logout, forgot/reset password, me
- Categories: `/api/categories` — nested categories, with counts
- Products: `/api/products` — public listing, CRUD for vendors, images upload
- Cart: `/api/cart` — persistent DB-backed cart, add, update, clear, apply coupon
- Orders: `/api/orders` — create order (splits by vendor, mock payment in dev), list, detail
- Vendor: `/api/vendor/*` — dashboard, vendor orders, wallet, withdraw (payout requests), bank details, paystack interactors (bank list, resolve account)
- Admin: `/api/admin/*` — overview, orders, customers, vendors, products, categories, disputes, payouts, refunds, reports, audit log, admin management
- Webhooks to add: `/api/webhooks/paystack`, `/api/webhooks/stripe`, `/api/webhooks/paypal` (development currently uses mock payment flows)

Auth & Security Notes
- Access tokens: short-lived (15m). Refresh tokens: long-lived (7d), stored and rotated.
- Admins created manually. `admin/login` is a dedicated endpoint.
- `authenticate` middleware + `requireRole()` guard used across routes.

Environment Variables (backend .env reference)
- `NODE_ENV`, `PORT`, `FRONTEND_URL`
- Database: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- JWT: `JWT_SECRET`, `JWT_ACCESS_EXPIRES=15m`, `JWT_REFRESH_EXPIRES=7d`
- Cloudinary: `CLOUDINARY_*`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`
- Payments: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
- Dev flag: `SKIP_EMAIL_VERIFICATION` (true to bypass OTP locally)

Running Locally (dev quick steps)
- Backend

```powershell
cd backend
npm install
# create .env using .env.example, ensure Postgres running
npm run migrate
npm run dev
```

- Frontend

```powershell
cd frontend
npm install
npm run dev
# Vite default: http://localhost:5173
```

Notes & Known Issues
- Express 5 server: call `server.ref()` after `app.listen()` to prevent early exit.
- Admin password: initial admin used a PHP-generated bcrypt hash; regenerate with `bcryptjs` if needed. Default dev admin: `admin@bryge.com` / `password` (CHANGE BEFORE PROD).
- Paystack: no native escrow — system implements its own escrow ledger. Manual payout must be enabled on Paystack account.
- Logistics integration: delivery status currently updated manually by admin; plan for webhook receiver for logistics partner.
- PostgreSQL on Windows: psql password input is invisible in PowerShell/Terminal; use CMD or set `PGPASSWORD` env var.

Coding & Repository Conventions
- Keep changes focused and minimal. Match existing style and patterns in `backend/src/controllers` and `routes`.
- Use parameterized SQL queries with `pg` (pool.query) helper in `backend/src/config/database.js` and wrap multi-statement operations in `withTransaction()`.
- Multer memory storage is used for uploads; images uploaded to Cloudinary via helper.
- Do not change public APIs without updating the frontend proxy and tests.

Priority Workstreams (from DESIGN.md remaining work)
- Implement real payment integrations (replace mock functions in `order.controller.js` with real Paystack/Stripe/PayPal flows and webhooks).
- Webhook handlers for payment gateways.
- 72-hour auto-release cron job to auto-release escrow when appropriate.
- Implement logistics webhook receiver and automate delivery status.
- Finish vendor settings sub-pages in frontend.
- Connect transactional email triggers to events (orders, disputes, payouts).

Where to Look First (for common tasks)
- Order flow & escrow: `backend/src/controllers/order.controller.js`, `backend/src/models/` (if present), `backend/src/database/migrations/*`.
- Payments: `backend/src/controllers/order.controller.js` for mock implementations; update here when integrating real gateways.
- Vendor wallet & payouts: `backend/src/controllers/vendor.controller.js`, `admin` payout endpoints in `backend/src/controllers/admin.controller.js`.

Commit & PR Guidance for Copilot
- When creating code changes that affect business rules (payments, escrow, payouts), include unit/integration tests and update `DESIGN.md` where rules change.
- Add clear TODO comments and link to `DESIGN.md` for complex domain logic (e.g., escrow release rules, dispute resolution).

Files of Interest (quick links)
- [docs/DESIGN.md](docs/DESIGN.md)
- [backend/src/index.js](backend/src/index.js)
- [backend/src/controllers/order.controller.js](backend/src/controllers/order.controller.js)
- [backend/src/config/database.js](backend/src/config/database.js)
- [backend/src/config/cloudinary.js](backend/src/config/cloudinary.js)
- [backend/src/utils/jwt.js](backend/src/utils/jwt.js)
- [backend/src/utils/email.js](backend/src/utils/email.js)
- [backend/src/database/migrations/001_initial_schema.sql](backend/src/database/migrations/001_initial_schema.sql)

If you need more granularity
- Ask for a specific area to expand (payments, cron jobs, webhook handlers, admin UX). Copilot will focus suggestions and code edits guided by the relevant DESIGN sections.

Last updated: 2026-06-02
(Generated from docs/DESIGN.md — keep the canonical file updated when rules or environment variables change.)
