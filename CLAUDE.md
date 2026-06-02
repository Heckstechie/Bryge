# CLAUDE.md — Bryge Platform

**Project:** Bryge — Cross-border, made simple.  
**Client:** Bryge Global Services Limited (Amy Chineyemba, Founder)  
**Developer:** Heckstechie (Adeleke Adetola Ayomide)  
**Repo:** `Heckstechie/bryge-platform` (private)  
**Domain:** bryge.com.ng

---

## What This Project Is

Bryge is a **multi-vendor e-commerce marketplace** connecting Nigerian diaspora customers (UK, US, Canada, Europe) with verified Nigerian vendors. Bryge handles the full cross-border commerce lifecycle:

1. Customer browses and purchases authentic Nigerian products
2. Vendor prepares and marks the order ready for pickup
3. Bryge agent collects from vendor and delivers internationally
4. Payment is held in escrow until delivery is confirmed
5. Vendor receives a Naira payout (minus Bryge's commission)

**Critical business rules to keep in mind at all times:**
- Bryge is the logistics layer — vendors do NOT arrange their own shipping
- All vendor payouts are in **Naira (NGN)** regardless of what currency the customer paid in
- Bryge implements its **own escrow** — Paystack has no native escrow product
- Commission is deducted at payout time, not at purchase time
- Products from **new vendors** start as `draft` and require admin approval; returning approved vendors go straight to `active`

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 19, Vite 8 |
| Styling | Tailwind CSS | v3 |
| Backend | Node.js + Express | Express 5 |
| Database | PostgreSQL | v17, port 5432 |
| DB Client | pg (node-postgres) | Raw SQL, parameterized queries |
| Auth | JWT | bcryptjs for hashing |
| Images | Cloudinary | Max 5 per product |
| Email | Resend API + Nodemailer | Transactional only |
| Payments | Paystack + Stripe + PayPal | **Mock functions in dev — not yet live** |
| Dev runner | Nodemon | Auto-restart |
| Production | Hostinger VPS + Nginx + PM2 | Ubuntu 22.04 |

**Frontend extras:** `axios`, `react-router-dom` v7, `@react-oauth/google`  
**No test suite is configured.** `npm test` exits with an error by design.

---

## Project Structure

```
bryge/
├── backend/
│   └── src/
│       ├── config/
│       │   ├── database.js         # pg Pool, query(), withTransaction()
│       │   └── cloudinary.js       # Cloudinary init + uploadBuffer()
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── product.controller.js
│       │   ├── category.controller.js
│       │   ├── cart.controller.js
│       │   ├── order.controller.js
│       │   ├── vendor.controller.js
│       │   └── admin.controller.js
│       ├── middleware/
│       │   ├── auth.js             # authenticate + requireRole()
│       │   ├── upload.js           # Multer memory storage
│       │   ├── validate.js         # express-validator formatter
│       │   └── errorHandler.js     # Central error handler
│       ├── routes/
│       │   ├── index.js            # Mounts all routers under /api
│       │   ├── auth.routes.js
│       │   ├── product.routes.js
│       │   ├── category.routes.js
│       │   ├── cart.routes.js
│       │   ├── order.routes.js
│       │   ├── vendor.routes.js
│       │   └── admin.routes.js
│       ├── utils/
│       │   ├── jwt.js              # signAccess, signRefresh, verifyAccess, verifyRefresh
│       │   └── email.js            # Branded email templates (Resend)
│       ├── database/
│       │   ├── migrations/
│       │   │   ├── 001_initial_schema.sql
│       │   │   └── 002_seed_data.sql
│       │   └── migrate.js          # Migration runner
│       └── index.js                # Express entry point
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── auth/               # Customer + admin auth screens
│       │   │   └── vendor/         # Vendor-specific auth screens
│       │   ├── admin/              # 22 admin dashboard pages
│       │   ├── vendor/             # Vendor dashboard pages + onboarding
│       │   │   └── onboarding/     # 7-step onboarding wizard
│       │   ├── shop/               # Public storefront pages
│       │   └── orders/             # Order confirmation
│       ├── components/
│       │   ├── admin/AdminShell.jsx
│       │   ├── vendor/VendorShell.jsx
│       │   ├── auth/AuthLayout.jsx
│       │   └── shop/               # ProductCard, FilterSidebar
│       ├── context/
│       │   ├── AuthContext.jsx     # useAuth() — user, loading, login, logout
│       │   └── CartContext.jsx     # useCart() — items, add, remove, clear
│       ├── services/api.js         # All API call functions (axios)
│       └── App.jsx                 # Routes + providers + route guards
├── docs/
│   └── DESIGN.md                   # Full platform design document
├── .gitignore
└── CLAUDE.md                       # This file
```

---

## Development Commands

### Starting the Dev Servers

Run these in **two separate terminals**:

```bash
# Terminal 1 — backend (port 5000)
cd backend
npm run dev
# Kills port 5000 first (Windows), then starts nodemon

# Terminal 2 — frontend (port 5173)
cd frontend
npm run dev
```

All `/api/*` requests from the frontend are proxied by Vite to `http://localhost:5000`. No CORS issues in dev.

### Database

```bash
cd backend
npm run migrate          # Run migrations only
npm run migrate:seed     # Run migrations + seed data
```

**Windows PostgreSQL note:** psql password input is invisible in PowerShell. Use Command Prompt for psql commands, or set `PGPASSWORD=Lanre1321` first in CMD.

### Port conflicts

```bash
npx kill-port 5000
```

---

## Module System

- **Backend:** CommonJS (`require` / `module.exports`) — `"type": "commonjs"` in package.json
- **Frontend:** ES Modules (`import` / `export`) — `"type": "module"` in package.json

Do not mix these up. Never use `import` in backend files or `require` in frontend files.

---

## Database

PostgreSQL 17. **No ORM — raw parameterized SQL only.** Use the `query()` helper from `backend/src/config/database.js` for all DB calls.

```js
const { query, withTransaction } = require('../config/database');

// Simple query
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

// Transaction
await withTransaction(async (client) => {
  await client.query('UPDATE ...', [...]);
  await client.query('INSERT ...', [...]);
});
```

**Never use string interpolation in SQL queries.** Always use `$1`, `$2`, etc. parameterized placeholders.

### Key Tables (30 total)

| Table | Purpose |
|-------|---------|
| `users` | All users — customer, vendor, admin, sub_admin |
| `vendor_profiles` | Vendor business info, wallet balances, bank details |
| `admin_profiles` | Admin/sub_admin info and permissions JSONB |
| `categories` | Product categories with `commission_rate`, supports `parent_id` for subcategories |
| `products` | Product listings; `commission_rate` snapshotted from category at creation |
| `orders` | Parent order per checkout |
| `vendor_orders` | Sub-orders per vendor within an order (BRG-001-V1 format) |
| `order_items` | Line items — product details snapshotted at purchase time |
| `payments` | Payment gateway records |
| `escrow_transactions` | Escrow state per vendor_order (holding → released / refunded) |
| `wallet_transactions` | Vendor wallet ledger (sale_credit, withdrawal_debit, etc.) |
| `payout_requests` | Vendor withdrawal requests → admin processes → PAY-001 receipts |
| `disputes` | Dispute lifecycle per vendor_order (DIS-001 format) |
| `cart_items` | Persistent cart — UNIQUE(customer_id, product_id) |
| `reviews` | Product + vendor ratings, verified purchase only |
| `notifications` | In-app notifications per user |
| `refresh_tokens` | JWT refresh tokens (stored in DB, rotated on use) |

---

## Authentication System

### JWT Configuration
- Access token: **15 minutes** — sent as `Authorization: Bearer <token>`
- Refresh token: **7 days** — stored in DB, rotated on every use
- Admin login: `POST /api/auth/admin/login` — separate endpoint from customer/vendor

### Auth Middleware (`backend/src/middleware/auth.js`)
```js
authenticate        // Verifies Bearer token, sets req.user
requireRole(roles)  // requireRole('admin', 'sub_admin')
```

### OTP System
- 6-digit code, expires in 10 minutes
- Resend cooldown: 60 seconds
- `SKIP_EMAIL_VERIFICATION=true` in `.env` bypasses OTP entirely in development

### Vendor Login State Gate
Every vendor login is gated by `vendor_profiles.status`:
- `pending` → Application Under Review screen
- `rejected` → Application Declined screen
- `active` + no bank details → Add Bank Details screen
- `active` + bank details → Vendor Dashboard

### Admin Account
- Admin accounts are created by the super admin only — no public registration
- Current dev credentials: `admin@bryge.com` / `password` — **must be changed before going live**
- The default hash was regenerated with bcryptjs (original PHP-generated hash was incompatible)

---

## User Roles & Route Guards (Frontend)

Four roles: `customer`, `vendor`, `admin`, `sub_admin`

Route guards in `App.jsx`:
- `ProtectedRoute` — requires login; `allow` prop restricts by role
- `GuestRoute` — redirects logged-in users to their dashboard
- `AdminGuestRoute` — redirects to `/admin/login`, not `/login`

Sub-admin permissions are stored in `admin_profiles.permissions` (JSONB). Sidebar items are hidden when the corresponding permission is `false`.

---

## Payment System

**Current state: all payments are mocked.** The functions `mockPaystackPayment()` and `mockStripePayment()` in `order.controller.js` return success immediately.

### When real keys arrive (from Amy), replace mocks with:

**Paystack (NGN):**
1. `POST https://api.paystack.co/transaction/initialize` → get `authorization_url`
2. Redirect customer to Paystack checkout
3. `POST /api/webhooks/paystack` — verify signature, update order status

**Stripe (USD):**
1. `stripe.paymentIntents.create()` → get `client_secret`
2. Use Stripe Elements in frontend
3. `POST /api/webhooks/stripe` — verify signature, update order status

**PayPal (USD):**
1. Create PayPal order → redirect to PayPal
2. `POST /api/webhooks/paypal` — capture payment, update order status

**Required Paystack account configuration (contact Paystack support):**
- Manual Payout must be enabled on the Bryge account
- USD payouts require a Zenith Bank domiciliary account (post-MVP)

### Paystack Transfer Flow (Vendor Payouts)
1. Vendor saves bank details → system calls Paystack `/transferrecipient` endpoint
2. Admin releases payout → system calls Paystack `/transfer` endpoint
3. Admin marks payout complete → `payout_requests.status = 'completed'`

---

## Order & Escrow Flow

### Order Status Lifecycle

```
pending → paid → new → processing → dispatched → out_for_delivery → delivered → completed
                                                                  ↘ disputed
```

| Status | Set By | Trigger |
|--------|--------|---------|
| `pending` | System | Checkout initiated |
| `paid` | System | Payment verified |
| `new` | System | Order confirmed, vendor notified |
| `processing` | Vendor | "Ready for Pickup" clicked |
| `dispatched` | Vendor | "Confirm Dispatched to Agent" clicked |
| `out_for_delivery` | Admin | Admin marks after agent pickup |
| `delivered` | Admin | Admin marks after delivery |
| `completed` | System | 72hr auto-release OR dispute resolved for vendor |
| `disputed` | Customer | Customer opens dispute |

### Multi-Vendor Order Splitting
One checkout → one parent `orders` record → one `vendor_orders` record per vendor → shared `order_items` linked to both. Overall order status = the most-behind sub-order.

### Escrow Logic (Custom — not Paystack native)
1. Customer pays → money sits in Bryge's Paystack/bank account
2. `escrow_transactions` created with `status = 'holding'`
3. Vendor `on_hold_balance` incremented in DB (ledger only)
4. After delivery + 72hr window (or dispute resolved for vendor):
   - Commission deducted
   - `on_hold_balance` → `available_balance`
   - `wallet_transactions` record created
   - `escrow_transactions.status` → `released`
5. Vendor requests withdrawal → `payout_requests` record created
6. Admin processes → Paystack Transfer API → marks complete

### 72-Hour Auto-Release (TO BE BUILT)
Cron job needed:
```js
// Run hourly — find delivered vendor_orders with no open dispute
// delivered_at < NOW() - INTERVAL '72 hours'
// → Release escrow, credit available_balance
```

---

## Commission Rates by Category

| Category | Rate |
|----------|------|
| Fabrics | 10% |
| Foodstuff | 8% |
| Accessories & Jewelry | 12% |
| Beauty | 10% |
| Home & Living | 9% |
| Art & Crafts | 11% |
| Digital (hidden at launch) | 15% |

Commission rate is **snapshotted onto the product** at creation time from the category. Changing a category's rate does not affect existing products.

---

## Design System

### Color Tokens

| Token | Hex | Tailwind Class | Usage |
|-------|-----|---------------|-------|
| Deep Navy | `#1E3A5F` | `bg-navy` / `text-navy` | Navbar, headings, primary buttons |
| Burnt Sienna (Rust) | `#953F10` | `bg-rust` / `text-rust` | CTAs, badges, highlights |
| Muted Sage Green | `#6B8F74` | `bg-sage` / `text-sage` | Success, delivered, approved |
| Warm Brown | `#7D5A3E` | `bg-brown` / `text-brown` | Secondary text, borders |
| Warm Off-White | `#F5F1E8` | `bg-cream` | All page backgrounds |
| Dark Navy | `#162C4A` | `bg-dark-navy` | Footer |

### Responsive Breakpoints
- **390px** — Mobile base (customer and vendor dashboards are mobile-first)
- **768px** — Tablet
- **1440px** — Desktop (storefront and admin dashboard)

### Button Variants

| Type | Background | Text |
|------|-----------|------|
| Primary | `#953F10` Rust | `#F5F1E8` |
| Secondary | Transparent | `#1E3A5F` Navy border |
| Secondary Dark | Transparent | `#F5F1E8` border |
| Success | `#6B8F74` Sage | `#F5F1E8` |
| Disabled | Brown 30% opacity | `#F5F1E8` |

---

## Email System

```
Provider: Resend API
Dev sender: Bryge <noreply@onboarding.resend.dev>
Prod sender: Bryge <noreply@mail.bryge.com.ng>  ← domain verification pending
```

Templates live in `backend/src/utils/email.js`. They are defined but **not yet wired up** to all controller events — connecting email triggers is part of remaining work.

`SKIP_EMAIL_VERIFICATION=true` in `.env` disables OTP emails in dev.

---

## API Endpoints Summary

### Auth (`/api/auth/`)
```
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/resend-code
POST /api/auth/login
POST /api/auth/admin/login      ← admin-only, dedicated endpoint
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

### Public
```
GET /api/categories
GET /api/categories/with-counts
GET /api/products
GET /api/products/:id
```

### Customer (authenticated)
```
GET/POST/PUT/DELETE /api/cart/...
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
```

### Vendor (`/api/vendor/`) — requires `vendor` role + `active` status
```
GET   /api/vendor/dashboard
GET   /api/vendor/orders
PATCH /api/vendor/orders/:id/status
GET   /api/vendor/wallet
POST  /api/vendor/withdraw
GET   /api/vendor/transactions
GET   /api/vendor/notifications
PATCH /api/vendor/notifications/read
GET   /api/vendor/banks
GET   /api/vendor/resolve-account
POST  /api/vendor/bank-details
PATCH /api/vendor/profile
```

### Admin (`/api/admin/`) — requires `admin` or `sub_admin` role
```
GET /admin/overview
GET/PATCH /admin/orders/:id
PATCH /admin/orders/:orderId/vendor-orders/:voId/status
GET/PATCH /admin/customers/:id
GET/PATCH /admin/vendors/:id
POST /admin/vendors/:id/approve
POST /admin/vendors/:id/reject
GET/PATCH /admin/products/:id
GET/POST/PUT/PATCH /admin/categories/:id
GET /admin/disputes
PATCH /admin/disputes/:id/review
POST /admin/disputes/:id/resolve
GET/POST /admin/payouts/:id/release
POST /admin/payouts/:id/complete
GET /admin/reports/sales
GET /admin/reports/vendors
GET /admin/reports/transactions
GET/POST/PATCH /admin/admins/:id
GET/PATCH /admin/profile
```

### Webhooks (TO BE BUILT)
```
POST /api/webhooks/paystack
POST /api/webhooks/stripe
POST /api/webhooks/paypal
```

---

## Environment Variables (backend/.env)

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bryge
DB_USER=postgres
DB_PASSWORD=Lanre1321

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Resend)
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Bryge <noreply@onboarding.resend.dev>

# Payments (keys from Amy — not yet provided)
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Dev Flags
SKIP_EMAIL_VERIFICATION=false
```

---

## What Is Complete vs. What Remains

### Completed
- Full database schema (30 tables, migrations, seed data)
- Auth system — 8 endpoints, OTP, JWT, role gating
- Vendor registration, onboarding wizard (7 steps), status gating
- Admin-only login (no registration, no forgot password)
- Product CRUD with Cloudinary image upload
- Category system with commission rates, nested tree
- Persistent cart with stock validation and coupon support
- Multi-vendor order splitting with escrow creation (mock payments)
- Admin dashboard — 22 pages, 50+ endpoints
- Vendor dashboard — all core screens (mobile-first)
- Email system — Resend configured, templates defined

### Remaining Work

**1. Customer Dashboard (highest priority — all screens, mobile-first)**
- Dashboard home (stat cards: Total Orders, Total Spent, Pending Deliveries)
- My Orders list (All | Active | Delivered | Disputed tabs)
- Order Detail (items, payment info, delivery info, Track My Order)
- Order Tracking (Jumia-style vertical timeline with pulse animation on current step)
- Leave a Review (product rating + vendor rating + comment)
- Notifications
- Profile & Settings (personal info, saved addresses, notification prefs, reviews, dispute history, help, terms)

**2. Real Payment Integration**
- Replace `mockPaystackPayment()` and `mockStripePayment()` in `order.controller.js`
- Build webhook handlers at `/api/webhooks/paystack`, `/stripe`, `/paypal`
- Requires payment keys from Amy Chineyemba

**3. 72-Hour Auto-Release Cron Job**
- Hourly job that finds `vendor_orders` with `status = 'delivered'` and `delivered_at < NOW() - INTERVAL '72 hours'` and no open dispute
- Releases escrow, credits `available_balance`, creates `wallet_transactions` record

**4. Email Trigger Wiring**
- Templates exist in `utils/email.js` but need to be called from the correct controller actions
- Affected events: order confirmed, vendor approved/rejected, dispute opened/resolved, payout processed/completed

**5. Vendor Settings Sub-Pages (5 missing)**
- `/vendor/settings/business`
- `/vendor/settings/password`
- `/vendor/settings/notifications`
- `/vendor/settings/support`
- `/vendor/settings/terms`

**6. Logistics Integration (blocked — partner TBD)**
- Admin manually updates delivery status for now
- When partner is confirmed: build generic webhook receiver at `/api/webhooks/logistics`

**7. Email Domain**
- Verify `mail.bryge.com.ng` in Resend dashboard
- Add DNS records in Hostinger for `bryge.com.ng`
- Update `EMAIL_FROM` env var in production

---

## Known Issues & Quirks

### Express 5 Event Loop
Express 5 calls `server.unref()` internally, which lets Node exit when nothing else is pending. Fixed with:
```js
const server = app.listen(PORT, () => { ... });
server.ref();
```
This line is already in `backend/src/index.js`. Do not remove it.

### Port 5000 Conflicts (Windows)
`npm run dev` in backend runs a `kill-port` script first. If the port is still stuck:
```bash
npx kill-port 5000
```

### Admin Password Hash Incompatibility
The original admin account hash was generated by PHP (incompatible with bcryptjs). Already fixed — the hash was regenerated with bcryptjs. Current dev password is `password` — must be changed in production.

### Paystack Escrow
Paystack has no native escrow product. Bryge's escrow is entirely a DB ledger (`escrow_transactions` + `vendor_profiles` balance columns). No actual bank movement happens until admin manually triggers a Paystack Transfer.

### Paystack Payouts — Irreversibility
Once a Paystack transfer is sent to a vendor, it cannot be reversed. If a dispute is resolved in the customer's favour after a vendor has already been paid, Bryge must recover from the vendor via terms of service.

### Digital Products
Category exists in the DB and products can be created in it. The storefront hides them by default. Admin can toggle visibility in Platform Settings. Do not expose at launch.

### Windows psql
Password input is invisible in PowerShell (security feature). Use Command Prompt with `set PGPASSWORD=Lanre1321` for psql operations.

---

## Deployment (Hostinger VPS)

| Item | Value |
|------|-------|
| Provider | Hostinger VPS (KVM 2 minimum, 2GB RAM) |
| OS | Ubuntu 22.04 |
| Domain | bryge.com.ng |
| Reverse proxy | Nginx |
| Process manager | PM2 |
| SSL | Let's Encrypt (certbot) |

Frontend is built as static files (`npm run build` → `/frontend/dist`) served by Nginx. Backend runs as a PM2 process proxied by Nginx at `/api/*`.

Production `.env` changes from dev:
- `NODE_ENV=production`
- `FRONTEND_URL=https://bryge.com.ng`
- `DATABASE_URL=postgresql://postgres:[password]@localhost:5432/bryge`
- `JWT_SECRET=[strong random string]`
- `SKIP_EMAIL_VERIFICATION=false`
- All `sk_live_` / `pk_live_` payment keys
- `EMAIL_FROM=Bryge <noreply@mail.bryge.com.ng>`
