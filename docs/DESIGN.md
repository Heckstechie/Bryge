# BRYGE — Platform Design Document
**Version:** 1.0  
**Last Updated:** June 2026  
**Prepared by:** Heckstechie (Adeleke Adetola Ayomide)  
**Client:** Bryge Global Services Limited (Amy Chineyemba, Founder)  
**Tagline:** Cross-border, made simple.

---

## TABLE OF CONTENTS

1. [Platform Overview](#1-platform-overview)
2. [Business Context](#2-business-context)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Database Schema](#5-database-schema)
6. [User Roles & Access Control](#6-user-roles--access-control)
7. [Authentication System](#7-authentication-system)
8. [Interface Specifications](#8-interface-specifications)
9. [Feature Specifications](#9-feature-specifications)
10. [Payment System](#10-payment-system)
11. [Order & Delivery Flow](#11-order--delivery-flow)
12. [Escrow Logic](#12-escrow-logic)
13. [Vendor Wallet System](#13-vendor-wallet-system)
14. [Dispute Resolution System](#14-dispute-resolution-system)
15. [Notification System](#15-notification-system)
16. [Email System](#16-email-system)
17. [Design System](#17-design-system)
18. [API Endpoint Reference](#18-api-endpoint-reference)
19. [Current Build Status](#19-current-build-status)
20. [Remaining Work](#20-remaining-work)
21. [Deployment Plan](#21-deployment-plan)
22. [Environment Variables](#22-environment-variables)
23. [Known Issues & Notes](#23-known-issues--notes)

---

## 1. PLATFORM OVERVIEW

Bryge is a **multi-vendor e-commerce marketplace** that connects Nigerians living abroad (diaspora) with verified vendors selling authentic Nigerian products. It handles the full cross-border commerce lifecycle — browsing, purchasing, escrow-protected payments, logistics coordination, and vendor payouts.

### Core Value Proposition
- Diaspora customers shop authentic Nigerian products from verified vendors
- Bryge coordinates all logistics (pickup from vendor → delivery to customer internationally)
- Escrow-protected payments — customer money held until delivery confirmed
- Vendors receive Naira payouts regardless of the currency customers pay in

### Target Audience
- **Customers:** Nigerians living in the UK, US, Canada, Europe, and other diaspora locations
- **Vendors:** Nigerian artisans, small businesses, and product sellers
- **Admin:** Bryge's internal operations team

---

## 2. BUSINESS CONTEXT

### Product Categories
Categories are managed by admin. Each category has a fixed commission rate.

| Category | Commission Rate |
|----------|----------------|
| Fabrics | 10% |
| Foodstuff | 8% |
| Accessories & Jewelry | 12% |
| Beauty | 10% |
| Home & Living | 9% |
| Art & Crafts | 11% |
| Digital (hidden at launch) | 15% |

### Currency Support
- **Naira (₦):** Nigerian customers via Paystack
- **USD ($):** International customers via Stripe and PayPal
- All vendor payouts are processed in **Naira** regardless of payment currency
- USD payments are converted to Naira by Bryge at prevailing rate at time of payout
- USD payouts require a Zenith Bank domiciliary account (post-MVP)

### Logistics Model
- Bryge partners with a logistics company (TBD)
- Vendors do NOT arrange their own shipping
- Vendor prepares product → marks "Ready for Pickup" → Bryge agent collects → delivers to customer
- Admin updates delivery status manually until logistics API is integrated

### Commission Model
- Commission % is fixed per product category
- Commission is deducted automatically when funds are released to vendor
- Example: ₦10,000 sale in Fabrics (10%) = ₦9,000 to vendor, ₦1,000 to Bryge

---

## 3. TECH STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React.js + Vite | Mobile-first responsive |
| Backend | Node.js + Express 5 | REST API |
| Database | PostgreSQL 17 | Local port 5432 |
| ORM/Query | pg (node-postgres) | Raw SQL with parameterized queries |
| Auth | JWT (access + refresh tokens) | bcryptjs for password hashing |
| Image Storage | Cloudinary | Product images, max 5 per product |
| Email | Resend API / Nodemailer | Transactional emails only |
| Payments | Paystack + Stripe + PayPal | Mock payments in dev |
| Dev Server | Nodemon | Auto-restart on file change |
| Hosting (prod) | Hostinger VPS | Ubuntu 22.04 + Nginx |
| Process Manager | PM2 | Keeps Node server alive in production |
| Version Control | GitHub | Private repo: Heckstechie/bryge-platform |

### Key Dependencies (Backend)
```
express, pg, dotenv, bcryptjs, jsonwebtoken, cors, nodemailer,
multer, express-validator, helmet, morgan, uuid, cloudinary
```

### Project Structure
```
C:\bryge-platform\
├── backend\
│   ├── src\
│   │   ├── config\
│   │   │   ├── database.js       # PostgreSQL pool + query() + withTransaction()
│   │   │   └── cloudinary.js     # Cloudinary init + uploadBuffer() helper
│   │   ├── controllers\
│   │   │   ├── auth.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── cart.controller.js
│   │   │   ├── order.controller.js
│   │   │   └── admin\            # All admin controllers
│   │   ├── middleware\
│   │   │   ├── auth.js           # authenticate + requireRole()
│   │   │   ├── upload.js         # Multer memory storage
│   │   │   ├── validate.js       # express-validator formatter
│   │   │   └── errorHandler.js   # Central error handler
│   │   ├── routes\
│   │   │   ├── auth.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── vendor.routes.js
│   │   │   └── admin.routes.js
│   │   ├── utils\
│   │   │   ├── jwt.js            # signAccess, signRefresh, verifyAccess, verifyRefresh
│   │   │   └── email.js          # Branded email templates
│   │   ├── database\
│   │   │   ├── migrations\
│   │   │   │   ├── 001_initial_schema.sql
│   │   │   │   └── 002_seed_data.sql
│   │   │   └── migrate.js        # Migration runner
│   │   └── index.js              # Express app entry point
│   ├── .env
│   └── package.json
├── frontend\
│   ├── src\
│   │   ├── pages\                # All screen components
│   │   ├── components\           # Reusable UI components
│   │   ├── context\              # CartContext, AuthContext
│   │   ├── api\                  # API call functions (api.js)
│   │   └── App.jsx               # Routes + CartProvider
│   ├── vite.config.js            # Proxy: /api → localhost:5000
│   └── package.json
├── .gitignore
└── README.md
```

---

## 4. ARCHITECTURE OVERVIEW

```
Browser (React + Vite :5173)
        │
        │ /api/* (proxied by Vite in dev)
        ▼
Express API Server (:5000)
        │
        ├── Auth Middleware (JWT verification)
        ├── Role Guards (requireRole)
        │
        ├── Controllers
        │     ├── Auth Controller
        │     ├── Product Controller
        │     ├── Cart Controller
        │     ├── Order Controller
        │     ├── Vendor Controller
        │     └── Admin Controller
        │
        ├── PostgreSQL Database (:5432)
        │     └── bryge database (30 tables)
        │
        ├── Cloudinary (image storage)
        ├── Paystack API (payments + transfers)
        ├── Stripe API (international payments)
        ├── PayPal API (international payments)
        └── Resend/Nodemailer (transactional emails)
```

### Vite Proxy Configuration
All `/api` requests from the browser are proxied to `http://localhost:5000` in development. This eliminates CORS issues. In production, Nginx handles the proxy.

---

## 5. DATABASE SCHEMA

### Core Tables (30 total)

#### users
```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
phone VARCHAR(20)
password_hash VARCHAR(255) NOT NULL
role VARCHAR(20) CHECK (role IN ('customer', 'vendor', 'admin', 'sub_admin'))
status VARCHAR(20) DEFAULT 'active'
email_verified BOOLEAN DEFAULT FALSE
phone_verified BOOLEAN DEFAULT FALSE
last_login_at TIMESTAMP
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### vendor_profiles
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
business_name VARCHAR(255)
business_type VARCHAR(100)
business_description TEXT
status VARCHAR(20) CHECK (status IN ('pending', 'active', 'rejected', 'suspended'))
-- pending = awaiting admin approval
-- active = approved, can list products
-- rejected = application rejected
-- suspended = temporarily deactivated
rejection_reason TEXT
approved_at TIMESTAMP
approved_by UUID REFERENCES users(id)
on_hold_balance DECIMAL(12,2) DEFAULT 0
available_balance DECIMAL(12,2) DEFAULT 0
total_earned DECIMAL(12,2) DEFAULT 0
bank_name VARCHAR(100)
account_number VARCHAR(20)
account_name VARCHAR(255)
paystack_recipient_code VARCHAR(100)
created_at TIMESTAMP DEFAULT NOW()
```

#### admin_profiles
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
display_name VARCHAR(255)
avatar_url TEXT
permissions JSONB DEFAULT '{}'
-- permissions object controls sub_admin access:
-- { orders: true, vendors: false, payouts: true, ... }
```

#### categories
```sql
id UUID PRIMARY KEY
name VARCHAR(100) UNIQUE NOT NULL
slug VARCHAR(100) UNIQUE NOT NULL
commission_rate DECIMAL(5,2) NOT NULL
description TEXT
icon_url TEXT
status VARCHAR(20) DEFAULT 'active'
parent_id UUID REFERENCES categories(id)
-- parent_id = NULL for top-level categories
-- parent_id = category UUID for subcategories
created_at TIMESTAMP DEFAULT NOW()
```

#### products
```sql
id UUID PRIMARY KEY
vendor_id UUID REFERENCES vendor_profiles(id)
category_id UUID REFERENCES categories(id)
name VARCHAR(255) NOT NULL
slug VARCHAR(255) UNIQUE
description TEXT
price DECIMAL(12,2) NOT NULL
stock_quantity INTEGER DEFAULT 0
weight_kg DECIMAL(8,3)
status VARCHAR(20) DEFAULT 'draft'
-- draft = awaiting admin approval (first-time vendor)
-- active = live on storefront
-- inactive = vendor deactivated
-- out_of_stock = auto-set when stock hits 0
commission_rate DECIMAL(5,2) -- snapshotted from category at creation
images JSONB DEFAULT '[]'
-- [{ url, public_id, is_primary }]
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### orders
```sql
id UUID PRIMARY KEY
customer_id UUID REFERENCES users(id)
order_number VARCHAR(20) UNIQUE -- e.g. BRG-001
status VARCHAR(30) DEFAULT 'pending'
subtotal DECIMAL(12,2)
shipping_fee DECIMAL(12,2)
discount_amount DECIMAL(12,2) DEFAULT 0
total_amount DECIMAL(12,2)
currency VARCHAR(10) DEFAULT 'NGN'
payment_method VARCHAR(50)
payment_reference VARCHAR(255)
delivery_address JSONB
-- { line1, line2, city, state, country, postal_code }
coupon_code VARCHAR(50)
created_at TIMESTAMP DEFAULT NOW()
```

#### vendor_orders (sub-orders)
```sql
id UUID PRIMARY KEY
order_id UUID REFERENCES orders(id)
vendor_id UUID REFERENCES vendor_profiles(id)
vendor_order_number VARCHAR(20) -- e.g. BRG-001-V1
status VARCHAR(30) DEFAULT 'new'
-- new → processing → dispatched → out_for_delivery → delivered → completed
subtotal DECIMAL(12,2)
commission_rate DECIMAL(5,2)
commission_amount DECIMAL(12,2)
vendor_payout_amount DECIMAL(12,2)
-- vendor_payout_amount = subtotal - commission_amount
created_at TIMESTAMP DEFAULT NOW()
```

#### order_items
```sql
id UUID PRIMARY KEY
order_id UUID REFERENCES orders(id)
vendor_order_id UUID REFERENCES vendor_orders(id)
product_id UUID REFERENCES products(id)
vendor_id UUID REFERENCES vendor_profiles(id)
product_name VARCHAR(255) -- snapshot at purchase time
product_image TEXT -- snapshot
unit_price DECIMAL(12,2) -- snapshot
quantity INTEGER
subtotal DECIMAL(12,2)
```

#### payments
```sql
id UUID PRIMARY KEY
order_id UUID REFERENCES orders(id)
gateway VARCHAR(50) -- paystack | stripe | paypal
reference VARCHAR(255) UNIQUE
amount DECIMAL(12,2)
currency VARCHAR(10)
status VARCHAR(30) -- pending | success | failed
gateway_response JSONB
created_at TIMESTAMP DEFAULT NOW()
```

#### escrow_transactions
```sql
id UUID PRIMARY KEY
vendor_order_id UUID REFERENCES vendor_orders(id)
amount DECIMAL(12,2)
status VARCHAR(30) DEFAULT 'holding'
-- holding → released | refunded
released_at TIMESTAMP
refunded_at TIMESTAMP
created_at TIMESTAMP DEFAULT NOW()
```

#### wallet_transactions
```sql
id UUID PRIMARY KEY
vendor_id UUID REFERENCES vendor_profiles(id)
type VARCHAR(50)
-- sale_credit | withdrawal_debit | commission_debit | refund_debit
amount DECIMAL(12,2)
balance_after DECIMAL(12,2)
reference VARCHAR(255)
description TEXT
created_at TIMESTAMP DEFAULT NOW()
```

#### payout_requests
```sql
id UUID PRIMARY KEY
vendor_id UUID REFERENCES vendor_profiles(id)
amount DECIMAL(12,2)
status VARCHAR(30) DEFAULT 'pending'
-- pending → processing → completed
receipt_number VARCHAR(20) -- e.g. PAY-001
transfer_reference VARCHAR(255)
bank_name VARCHAR(100)
account_number VARCHAR(20)
account_name VARCHAR(255)
released_by UUID REFERENCES users(id)
released_at TIMESTAMP
completed_at TIMESTAMP
created_at TIMESTAMP DEFAULT NOW()
```

#### disputes
```sql
id UUID PRIMARY KEY
order_id UUID REFERENCES orders(id)
vendor_order_id UUID REFERENCES vendor_orders(id)
customer_id UUID REFERENCES users(id)
vendor_id UUID REFERENCES vendor_profiles(id)
dispute_number VARCHAR(20) -- e.g. DIS-001
reason VARCHAR(100)
-- item_not_received | wrong_item | item_damaged | other
customer_statement TEXT
vendor_statement TEXT
status VARCHAR(30) DEFAULT 'open'
-- open → under_review → resolved
resolution VARCHAR(30)
-- release_to_vendor | refund_customer
resolution_note TEXT
resolved_by UUID REFERENCES users(id)
resolved_at TIMESTAMP
created_at TIMESTAMP DEFAULT NOW()
```

#### cart_items
```sql
id UUID PRIMARY KEY
customer_id UUID REFERENCES users(id)
product_id UUID REFERENCES products(id)
quantity INTEGER DEFAULT 1
created_at TIMESTAMP DEFAULT NOW()
UNIQUE(customer_id, product_id)
```

#### reviews
```sql
id UUID PRIMARY KEY
order_item_id UUID REFERENCES order_items(id)
customer_id UUID REFERENCES users(id)
product_id UUID REFERENCES products(id)
vendor_id UUID REFERENCES vendor_profiles(id)
product_rating INTEGER CHECK (product_rating BETWEEN 1 AND 5)
vendor_rating INTEGER CHECK (vendor_rating BETWEEN 1 AND 5)
comment TEXT
is_verified_purchase BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
```

#### notifications
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
type VARCHAR(100)
title VARCHAR(255)
body TEXT
is_read BOOLEAN DEFAULT FALSE
link TEXT
created_at TIMESTAMP DEFAULT NOW()
```

---

## 6. USER ROLES & ACCESS CONTROL

### Four Roles

| Role | Description | Dashboard |
|------|-------------|-----------|
| `customer` | Buyers on the platform | Customer Dashboard (mobile-first) |
| `vendor` | Approved sellers | Vendor Dashboard (mobile-first) |
| `admin` | Super admin — full access | Admin Dashboard (desktop) |
| `sub_admin` | Limited admin — permissions-based | Admin Dashboard (restricted) |

### Sub-Admin Permissions
Super admin can toggle permissions per sub-admin:
```json
{
  "orders": true,
  "update_delivery_status": true,
  "vendors": false,
  "approve_vendors": false,
  "payouts": false,
  "disputes": true,
  "reports": false,
  "products": false,
  "settings": false
}
```
Sidebar items are hidden for permissions set to `false`.

### Route Guards
- `authenticate` middleware — verifies JWT access token
- `requireRole('admin', 'sub_admin')` — role-based guard
- Vendor routes check `vendor_profiles.status = 'active'`

---

## 7. AUTHENTICATION SYSTEM

### Customer Auth Flow
```
Register (/register) → Role Select → Customer Details Form
→ Email Verification (OTP) → Customer Dashboard
```

### Vendor Auth Flow
```
Register (/register) → Role Select → Vendor Details Form
→ Email Verification (OTP) → Onboarding Wizard (7 steps)
→ Application Pending Screen
→ [Admin Approves] → Email Notification
→ Add Bank Details (first login after approval)
→ Vendor Dashboard
```

### Admin Auth Flow
```
Admin Login (/admin/login) — dedicated endpoint
No registration, no forgot password link
Accounts created by super admin only
```

### JWT Configuration
- Access token: short-lived (15 minutes)
- Refresh token: long-lived (7 days), stored in DB, rotated on use
- Admin login uses `/api/auth/admin/login` — separate from customer/vendor

### OTP System
- 6-digit code
- Expires after 10 minutes
- Resend available after 60 seconds
- `SKIP_EMAIL_VERIFICATION=true` in `.env` bypasses OTP for local development

### Vendor Status Gate
Every vendor login checks `vendor_profiles.status`:
- `pending` → redirect to Application Under Review screen
- `rejected` → redirect to Application Declined screen
- `active` + no bank details → redirect to Add Bank Details screen
- `active` + bank details → redirect to Vendor Dashboard

---

## 8. INTERFACE SPECIFICATIONS

### Interface 1: Public Storefront
**Viewport:** Desktop (1440px) + Mobile responsive  
**Auth required:** No (browse/search free, checkout requires login)

**Pages:**
- Homepage
- Product listing/browse (`/shop`)
- Single product detail (`/shop/product/:id`)
- Cart (`/cart`)
- Checkout (`/checkout`)
- Order confirmation (`/order-confirmation/:id`)
- Search results
- Vendor application (`/become-a-vendor`)
- Login (`/login`)
- Register (`/register`)

---

### Interface 2: Customer Dashboard
**Viewport:** Mobile-first (390px), responsive to desktop  
**Auth required:** Yes — role: `customer`  
**Bottom navigation:** Home | Shop | Orders | Notifications | Account

**Pages:**
- Dashboard home — greeting, stat cards (Total Orders, Total Spent, Pending Deliveries), recent orders, promotional banner
- My Orders list — filter tabs: All | Active | Delivered | Disputed
- Order Detail — items, status, payment info, delivery info, Track My Order button
- Order Tracking — Jumia-style vertical timeline
- Leave a Review — product rating + vendor rating + comment
- Notifications
- Profile & Settings
  - Personal Information
  - Saved Addresses
  - Notification Preferences
  - Language & Currency
  - My Reviews
  - Dispute History
  - Help & Support
  - Terms & Privacy
  - Sign Out

---

### Interface 3: Vendor Dashboard
**Viewport:** Mobile-first (390px), responsive to desktop  
**Auth required:** Yes — role: `vendor`, status: `active`  
**Bottom navigation:** Home | Products | Orders | Wallet | Profile

**Pages:**
- Dashboard home — stats (Total Sales, Pending Orders, Available Balance), recent orders, low stock alert
- My Products — filter tabs, search, toggle switch per product
- Add/Edit Product — drag-drop image upload, category/subcategory chained dropdowns, commission hint
- My Orders — tabs: All | New | Preparing | Dispatched | Completed
- Order Detail — Ready for Pickup button → Confirm Dispatched button (progressive replacement)
- Wallet/Withdraw — available balance, on hold, withdrawal request
- Transaction History — tabs: All | Sales | Withdrawals
- Notifications — tabs: All | Orders | Payouts | Updates
- Settings
  - Business Information
  - Bank Details (live Paystack account resolution)
  - Change Password
  - Notification Preferences
  - Help & Support
  - Terms & Privacy
  - Sign Out

**Onboarding Wizard (7 steps):**
1. Documents (CAC / proof of address)
2. Business (type, registration, industry)
3. Registration details
4. People (profile, identity, address, BVN)
5. Banking (live Paystack bank list + account resolution)
6. Agreement (service agreement signing)
7. Summary (incomplete vs completed sections, "Activate my business" button)

---

### Interface 4: Admin Dashboard
**Viewport:** Desktop (1440px)  
**Auth required:** Yes — role: `admin` or `sub_admin`  
**Navigation:** Fixed left sidebar (240px) with nested subsections

**Sidebar Structure:**
```
🏠 Overview
📦 Orders
    ├── All Orders
    ├── Pending Dispatch
    └── Delivery Updates
👥 Vendors
    ├── All Vendors
    ├── Applications
    └── Suspended Vendors
🛍 Products
    ├── All Products
    ├── Pending Review
    └── Categories & Commission
💰 Payouts
    ├── Payout Queue
    ├── Completed Payouts
    └── Withdrawal Requests
⚖️ Disputes
    ├── Open Disputes
    ├── Under Review
    └── Resolved
📊 Reports
    ├── Sales Analytics
    ├── Vendor Performance
    └── Transaction History
⚙️ Settings
    ├── Platform Settings
    ├── Payment Gateways
    ├── Admin Management
    └── Admin Profile
```

**22 Admin Pages Built:**
AdminDashboard, AdminLogin, AdminOrders, AdminOrderDetail, AdminCustomers, AdminCustomerDetail, AdminVendors, AdminVendorDetail, AdminVendorApplication, AdminProducts, AdminCategories, AdminPayouts, AdminPayoutDetail, AdminRefunds, AdminDisputes, AdminDisputeDetail, AdminReports, AdminVendorPerformance, AdminTransactionHistory, AdminAuditLog, AdminNotifications, AdminSettings, AdminPaymentGateways, AdminManagement, AdminProfile

---

## 9. FEATURE SPECIFICATIONS

### Product System
- Vendors upload products with up to 5 images (Cloudinary)
- First image is auto-set as cover/primary
- Products from new vendors start as `draft` — require admin approval
- Products from returning approved vendors go directly to `active`
- Stock auto-sets to `out_of_stock` when quantity reaches 0
- Auto-restores to `active` when restocked
- Cannot toggle inactive a product that is `out_of_stock` — must restock first
- Commission rate is snapshotted from category at creation time

### Cart System
- Persistent cart stored in database per customer
- `UNIQUE(customer_id, product_id)` — adding same product increments quantity
- Stock validation on add and on checkout
- Coupon/promo code support
- Free shipping banner threshold configurable

### Multi-Vendor Order Splitting
When a customer checks out with items from multiple vendors:
1. One parent `orders` record created
2. Items grouped by `vendor_id`
3. One `vendor_orders` record per vendor group
4. Each vendor sub-order gets independent status tracking
5. Customer sees one unified order — vendors see only their portion
6. Overall order status = most-behind vendor sub-order status

### Digital Products
- Built into the system (category exists, products can be created)
- Hidden from storefront by default
- Admin can toggle visibility via Platform Settings
- Expected to be enabled post-MVP

---

## 10. PAYMENT SYSTEM

### Payment Gateways

| Gateway | Currency | Use Case |
|---------|---------|---------|
| Paystack | NGN | Nigerian customers — cards, bank transfer, USSD |
| Stripe | USD | International card payments |
| PayPal | USD | International PayPal payments |

### Current State (Development)
Mock payment functions in `order.controller.js`:
```js
function mockPaystackPayment({ amount, email }) { ... }
function mockStripePayment({ amount, email }) { ... }
```
These return success immediately for testing. Replace with real API calls when keys are available.

### Paystack Integration Notes
- Manual Payout must be enabled on Bryge's Paystack account (contact Paystack support)
- Customer payments land in Bryge's Paystack balance
- Bryge controls when to transfer to vendors via Transfers API
- Vendor bank details → Paystack transfer recipient created via `/api/vendor/bank-details`
- Bulk transfers supported but may trigger compliance review
- Webhook required for payment verification (to be implemented)

### Paystack API Key Location
```
backend/.env
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
```

### Real Paystack Swap (When Ready)
Replace the two mock functions in `order.controller.js` with:
1. `POST https://api.paystack.co/transaction/initialize` — initialize payment
2. Redirect customer to Paystack checkout URL
3. Paystack webhook `POST /api/webhooks/paystack` — verify payment, update order status

---

## 11. ORDER & DELIVERY FLOW

### Order Status Progression

| Status | Set By | Trigger |
|--------|--------|---------|
| `pending` | System | Cart checkout initiated |
| `paid` | System | Payment verified |
| `new` | System | Order confirmed, vendor notified |
| `processing` | Vendor | Vendor clicks "Ready for Pickup" |
| `dispatched` | Vendor | Vendor clicks "Confirm Dispatched to Agent" |
| `out_for_delivery` | Admin | Admin marks after agent picks up |
| `delivered` | Admin | Admin marks after agent delivers |
| `completed` | System | 72hr window passes OR dispute resolved in vendor's favour |
| `disputed` | Customer | Customer opens dispute |

### Vendor Action Buttons (Progressive Replacement)
```
Status: new
→ Shows: [Ready for Pickup] button (rust)

Vendor confirms → Status: processing
→ Shows: ✓ Ready for Pickup (sage green, disabled)
         [Confirm Dispatched to Agent] button (rust)

Vendor confirms → Status: dispatched
→ Shows: ✓ Ready for Pickup (disabled)
         ✓ Dispatched to Agent (disabled)
         No more vendor actions
```

### 72-Hour Auto-Release
```
Admin marks Delivered
    ↓
72-hour countdown starts
    ↓
Two paths:
Customer raises dispute → funds freeze, admin resolves
No dispute after 72hrs → funds auto-release to vendor
```

### Order Tracking Screen
Jumia-style vertical timeline:
- Completed steps: sage green circle + white checkmark
- Current step: rust circle + pulse animation
- Upcoming steps: grey empty circle
- Statuses shown: Order Placed → Vendor Preparing → Ready for Pickup → Dispatched → Out for Delivery → Delivered

---

## 12. ESCROW LOGIC

Bryge does NOT use Paystack's native escrow (it doesn't exist). Bryge implements its own escrow logic:

### How It Works
1. Customer pays → money sits in Bryge's Paystack/bank account
2. System creates `escrow_transactions` record with `status = 'holding'`
3. Vendor wallet `on_hold_balance` is credited (database ledger only — no actual bank movement yet)
4. When delivery confirmed or 72hrs pass:
   - Commission deducted from vendor payout
   - `on_hold_balance` decremented
   - `available_balance` incremented
   - `wallet_transactions` record created
   - `escrow_transactions` status → `released`
5. Vendor requests withdrawal → `payout_requests` record created
6. Admin processes payout via Paystack Transfer API
7. Admin marks payout complete → `payout_requests.status = 'completed'`

### Dispute Impact on Escrow
- Customer opens dispute → `escrow_transactions.status` stays `holding`
- 72hr timer cancelled
- Admin resolves → either `released` (vendor) or `refunded` (customer)
- If refunded after vendor already paid: Bryge recovers from vendor via terms of service

---

## 13. VENDOR WALLET SYSTEM

### Three Balance States

| State | Meaning | DB Column |
|-------|---------|-----------|
| On Hold | Order placed, not yet delivered | `on_hold_balance` |
| Available for Withdrawal | Delivered, commission deducted | `available_balance` |
| Total Earned | Lifetime earnings | `total_earned` |

### Wallet Display (Vendor Dashboard)
```
Available for Withdrawal    On Hold
₦85,000                    ₦32,000
[Request Withdrawal]
```

### Withdrawal Flow
1. Vendor enters amount + confirms bank details
2. `POST /vendor/withdraw` → creates `payout_requests` record
3. Admin sees in Payout Queue → clicks "Release Payment"
4. Admin enters transfer reference number
5. Admin marks "Completed"
6. Vendor receives notification: "₦X has been transferred to your account"

### Payout Receipt
Auto-generated PDF on completion containing:
- Receipt number (PAY-001 format)
- Vendor details + bank details
- Order reference
- Sale amount, commission, net payout
- Transfer reference number
- Timestamp

---

## 14. DISPUTE RESOLUTION SYSTEM

### Dispute Lifecycle
```
Customer clicks "There's a Problem"
    ↓
Dispute created (status: open)
Funds frozen in escrow
Both parties notified
    ↓
Admin reviews → clicks "Start Review"
(status: under_review)
    ↓
Admin reviews evidence from both sides
Admin writes resolution note
Admin selects:
  [Release to Vendor] OR [Refund Customer]
    ↓
Resolution confirmed
Both parties notified with resolution note
Escrow funds moved accordingly
```

### Dispute Reasons
- `item_not_received`
- `wrong_item_delivered`
- `item_arrived_damaged`
- `other`

### Resolution Report
Auto-generated PDF on resolution, similar to payout receipt.

---

## 15. NOTIFICATION SYSTEM

### Vendor Notifications
| Event | Type |
|-------|------|
| New order received | `order_placed` |
| Order status updated | `order_confirmed`, `order_shipped`, `order_delivered` |
| Funds released | `escrow_released` |
| Payout processed | `payout_processed` |
| Payout failed | `payout_failed` |
| Low stock (≤5 units) | `low_stock` |
| Application approved | `vendor_approved` |
| Application rejected | `vendor_rejected` |
| Review posted | `review_posted` |

### Customer Notifications
| Event | Type |
|-------|------|
| Order confirmed | `order_confirmed` |
| Order status updates | `order_shipped`, `order_delivered` |
| Dispute update | `dispute_update` |
| Refund processed | `refund_processed` |

### Admin Notifications (Aggregated)
- Pending vendor applications
- Open disputes
- Pending payouts
- New orders

### Notification UI
- Bell icon with red unread count badge
- Auto-marks all read on page open
- Tabs: All | Orders | Payouts | Updates (vendor) / All | Orders | Alerts (customer)

---

## 16. EMAIL SYSTEM

### Current Configuration
```
Provider: Resend API
Sender: Bryge <noreply@onboarding.resend.dev> (dev)
Sender: Bryge <noreply@mail.bryge.com.ng> (production)
```

### Production Domain Setup
1. Verify `mail.bryge.com.ng` subdomain in Resend dashboard
2. Add DNS records in Hostinger for `bryge.com.ng`
3. Update `EMAIL_FROM` in `.env`

### Transactional Emails

| Email | Trigger |
|-------|---------|
| OTP Verification | Customer/vendor registration |
| Password Reset | Forgot password request |
| Order Confirmation | Successful payment |
| Vendor New Order | Customer places order |
| Vendor Approved | Admin approves application |
| Vendor Rejected | Admin rejects application (includes reason) |
| Dispute Opened | Customer raises dispute |
| Dispute Resolved | Admin resolves dispute (sent to both parties) |
| Payout Processed | Admin releases vendor payment |
| Payout Completed | Transfer confirmed |

### Dev Override
```
SKIP_EMAIL_VERIFICATION=true  # bypasses OTP in development
SKIP_EMAIL_VERIFICATION=false # enables OTP (production)
```

---

## 17. DESIGN SYSTEM

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Deep Navy (Primary) | `#1E3A5F` | Navbar, headings, primary buttons, section backgrounds |
| Burnt Sienna (Accent) | `#953F10` | CTAs, badges, category labels, highlights |
| Muted Sage Green (Success) | `#6B8F74` | Delivered, confirmed, verified badges, success states |
| Warm Brown (Neutral) | `#7D5A3E` | Secondary text, borders, dividers, captions |
| Warm Off-White (Background) | `#F5F1E8` | Page background on all screens |
| Dark Navy (Footer) | `#162C4A` | Footer background |

### Typography Scale

| Element | Size | Weight |
|---------|------|--------|
| H1 Page Headlines | 54px | Bold |
| H2 Section Headings | 40px | Bold |
| H3 Card/Step Titles | 24px | Semibold |
| Hero Subheading | 18-20px | Regular |
| Body Text | 16px | Regular |
| Secondary/Caption | 14px | Regular |
| Badges/Labels | 12px | Semibold |
| Button Text | 16px | Semibold |

### Button Styles

| Type | Background | Text | Use |
|------|-----------|------|-----|
| Primary | `#953F10` Rust | `#F5F1E8` | Main CTAs |
| Secondary | Transparent | `#1E3A5F` | Ghost on light bg |
| Secondary Dark | Transparent | `#F5F1E8` | Ghost on dark bg |
| Success | `#6B8F74` Green | `#F5F1E8` | Confirm, approve |
| Disabled | `#7D5A3E` 30% | `#F5F1E8` | Inactive states |

### Responsive Breakpoints
- Mobile: 390px (default — customer and vendor dashboards)
- Tablet: 768px
- Desktop: 1440px (storefront and admin)

### Homepage Section Color Rhythm
1. Hero — Dark (navy overlay on photo)
2. Categories — Off-White
3. How It Works — Navy
4. Products — Off-White
5. Trust Section — Off-White
6. Vendor CTA — Rust
7. Final Banner — Navy
8. Footer — Dark Navy

---

## 18. API ENDPOINT REFERENCE

### Auth (`/api/auth/`)
```
POST /api/auth/register              # Customer or vendor registration
POST /api/auth/verify-email          # OTP verification
POST /api/auth/resend-code           # Resend OTP
POST /api/auth/login                 # Customer/vendor login
POST /api/auth/admin/login           # Admin-only login (dedicated endpoint)
POST /api/auth/refresh               # Rotate refresh token
POST /api/auth/logout                # Revoke refresh token
POST /api/auth/forgot-password       # Send reset link
POST /api/auth/reset-password        # Set new password
GET  /api/auth/me                    # Current user (requires Bearer token)
```

### Categories (`/api/categories/`)
```
GET /api/categories                  # Nested tree of all categories
GET /api/categories/with-counts      # Categories with product counts (filter sidebar)
```

### Products (`/api/products/`)
```
GET    /api/products                 # All active products (public, with filters)
GET    /api/products/:id             # Single product detail
POST   /api/products                 # Create product (vendor only)
PUT    /api/products/:id             # Update product (vendor only)
DELETE /api/products/:id             # Delete product (vendor only)
POST   /api/products/:id/images      # Upload images to Cloudinary
PATCH  /api/products/:id/toggle      # Toggle product active/inactive
```

### Cart (`/api/cart/`)
```
GET    /api/cart                     # Get cart with enriched items
POST   /api/cart/add                 # Add/increment item
PUT    /api/cart/:itemId             # Update quantity
DELETE /api/cart/:itemId             # Remove item
DELETE /api/cart/clear               # Empty cart
POST   /api/cart/apply-coupon        # Apply promo code
```

### Orders (`/api/orders/`)
```
POST /api/orders                     # Create order (splits by vendor, mock payment)
GET  /api/orders                     # Customer order history
GET  /api/orders/:id                 # Single order with vendor sub-orders
```

### Vendor (`/api/vendor/`)
```
GET   /api/vendor/dashboard          # Stats + wallet + recent orders
GET   /api/vendor/orders             # Vendor's orders (LATERAL JOIN)
PATCH /api/vendor/orders/:id/status  # pending→processing, processing→dispatched
GET   /api/vendor/wallet             # Balance + bank info
POST  /api/vendor/withdraw           # Create payout request
GET   /api/vendor/transactions       # Wallet transaction ledger
GET   /api/vendor/notifications      # Notifications by category
PATCH /api/vendor/notifications/read # Mark all read
GET   /api/vendor/banks              # Paystack bank list (cached 1hr)
GET   /api/vendor/resolve-account    # Paystack account name resolution
POST  /api/vendor/bank-details       # Save bank + create Paystack recipient
PATCH /api/vendor/profile            # Save onboarding profile data
```

### Admin (`/api/admin/`)
```
# Overview
GET /admin/overview

# Orders
GET   /admin/orders
GET   /admin/orders/:id
PATCH /admin/orders/:orderId/vendor-orders/:voId/status

# Customers
GET   /admin/customers
GET   /admin/customers/:id
PATCH /admin/customers/:id/status

# Vendors
GET  /admin/vendors
GET  /admin/vendors/:id
PATCH /admin/vendors/:id/status
GET  /admin/vendors/applications
GET  /admin/vendors/applications/:id
POST /admin/vendors/:id/approve
POST /admin/vendors/:id/reject

# Products
GET   /admin/products
GET   /admin/products/:id
PATCH /admin/products/:id/status

# Categories
GET   /admin/categories
POST  /admin/categories
PUT   /admin/categories/:id
PATCH /admin/categories/:id/status

# Disputes
GET  /admin/disputes
GET  /admin/disputes/:id
PATCH /admin/disputes/:id/review
PATCH /admin/disputes/:id/note
POST /admin/disputes/:id/resolve

# Payouts
GET  /admin/payouts
GET  /admin/payouts/:id
POST /admin/payouts/:id/release
POST /admin/payouts/:id/complete

# Refunds
GET /admin/refunds

# Reports
GET /admin/reports/sales
GET /admin/reports/vendors
GET /admin/reports/transactions

# Notifications
GET /admin/notifications

# Audit Log
GET /admin/audit-log

# Admin Management
GET   /admin/admins
POST  /admin/admins
PATCH /admin/admins/:id
PATCH /admin/admins/:id/status

# Profile
GET   /admin/profile
PATCH /admin/profile
```

---

## 19. CURRENT BUILD STATUS

### ✅ Completed

| Feature | Details |
|---------|---------|
| Database Schema | 30 tables, all relationships, seed data |
| Auth System | 8 endpoints, 7 frontend screens, OTP, JWT |
| Vendor Auth | Registration, onboarding wizard, status gating |
| Admin Auth | Dedicated endpoint, no forgot password |
| Product System | Full CRUD, Cloudinary images, category filters |
| Category System | Nested tree, commission rates |
| Cart System | Persistent, stock validation, coupons |
| Order System | Multi-vendor splitting, escrow creation, mock payments |
| Admin Dashboard | 22 pages, 50+ endpoints |
| Vendor Dashboard | Full mobile-first interface, all screens |
| Email System | Resend configured, templates ready |

### ⏳ In Progress / Partially Done

| Feature | Status |
|---------|--------|
| Email delivery | Configured, domain verification pending |
| Vendor settings sub-pages | 5 pages not yet built |

---

## 20. REMAINING WORK

### Customer Dashboard (Next to Build)
All screens mobile-first:
- Dashboard home (Total Orders, Total Spent, Pending Deliveries stats, recent orders, promo banner)
- My Orders list (All | Active | Delivered | Disputed tabs)
- Order Detail (items, payment info, delivery info)
- Order Tracking (vertical timeline)
- Leave a Review (product + vendor rating)
- Notifications
- Profile & Settings (personal info, addresses, preferences, reviews, disputes)

### Real Payment Integration
Replace mock functions in `order.controller.js`:
```js
// Replace mockPaystackPayment() with:
// 1. POST https://api.paystack.co/transaction/initialize
// 2. Return authorization_url for redirect
// 3. POST /api/webhooks/paystack to verify

// Replace mockStripePayment() with:
// 1. stripe.paymentIntents.create()
// 2. Return client_secret for Stripe Elements
```

**Required from Amy:**
- Paystack secret key + public key
- Manual Payout enabled on Paystack account
- Stripe secret key + publishable key
- PayPal client ID + secret

### Webhook Handlers
```
POST /api/webhooks/paystack   # Verify payment, update order status
POST /api/webhooks/stripe     # Stripe payment confirmation
POST /api/webhooks/paypal     # PayPal payment confirmation
```

### Logistics Integration
- TBD — logistics partner not yet confirmed
- Currently: admin manually updates delivery status
- Future: logistics API webhook auto-updates order status
- Build generic webhook receiver that accepts any partner's delivery updates

### Vendor Settings Sub-Pages
- `/vendor/settings/business` — Business Information edit
- `/vendor/settings/password` — Change Password
- `/vendor/settings/notifications` — Notification Preferences toggles
- `/vendor/settings/support` — Help & Support
- `/vendor/settings/terms` — Terms & Privacy

### Email Notifications (Full Implementation)
Connect email sending to actual order/dispute/payout events. Templates exist in `utils/email.js` but need to be triggered from the correct controller actions.

### 72-Hour Auto-Release Cron Job
```js
// Run every hour
// Find vendor_orders where status = 'delivered'
// AND delivered_at < NOW() - INTERVAL '72 hours'
// AND no open dispute exists
// → Release escrow, credit vendor available_balance
```

### Admin Domain Email
When domain verification is complete:
1. Verify `mail.bryge.com.ng` in Resend
2. Update `EMAIL_FROM=Bryge <noreply@mail.bryge.com.ng>` in `.env`

---

## 21. DEPLOYMENT PLAN

### Server Specs
- Provider: Hostinger VPS
- Plan: KVM 2 minimum (2GB RAM)
- OS: Ubuntu 22.04
- Web server: Nginx (reverse proxy)
- Process manager: PM2
- SSL: Let's Encrypt (free)
- Domain: bryge.com.ng

### Deployment Steps
```bash
# 1. SSH into VPS
ssh root@[VPS_IP]

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# 4. Install Nginx
sudo apt install nginx

# 5. Install PM2
npm install -g pm2

# 6. Clone repo
git clone https://github.com/Heckstechie/bryge-platform.git
cd bryge-platform

# 7. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 8. Set up .env on server
# Copy .env.example and fill in production values

# 9. Run database migrations
cd backend && npm run migrate

# 10. Build frontend
cd frontend && npm run build

# 11. Configure Nginx
# Serve /frontend/dist as static files
# Proxy /api/* to localhost:5000

# 12. Start backend with PM2
cd backend && pm2 start src/index.js --name bryge-api
pm2 startup && pm2 save

# 13. SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bryge.com.ng -d www.bryge.com.ng

# 14. Final DNS update
# Point bryge.com.ng A record to VPS IP
```

### Production Environment Variables
All variables in `SKIP_EMAIL_VERIFICATION=false` for production. Update:
- `NODE_ENV=production`
- `FRONTEND_URL=https://bryge.com.ng`
- `DATABASE_URL=postgresql://postgres:[password]@localhost:5432/bryge`
- `JWT_SECRET=[strong random string]`
- `PAYSTACK_SECRET_KEY=sk_live_...`
- `STRIPE_SECRET_KEY=sk_live_...`
- `CLOUDINARY_*` production credentials
- `EMAIL_FROM=Bryge <noreply@mail.bryge.com.ng>`

---

## 22. ENVIRONMENT VARIABLES

### Full `.env` Reference (backend)
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

# Payments
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

## 23. KNOWN ISSUES & NOTES

### Express 5 Server Exit
Express 5 calls `.unref()` on the HTTP server it creates internally. Fixed by:
```js
const server = app.listen(PORT, () => { ... });
server.ref(); // Re-anchors event loop
```

### CORS Configuration
Vite proxy (`vite.config.js`) forwards all `/api` requests to `localhost:5000` in development. This eliminates CORS issues. The `FRONTEND_URL` in `.env` must match Vite's actual port (`5173`).

### PostgreSQL on Windows
- psql password input is invisible in PowerShell and CMD (security feature — just type and press Enter)
- Use `set PGPASSWORD=Lanre1321` before psql commands in CMD
- VS Code terminal uses PowerShell which has issues with psql password input — use Command Prompt for database operations

### Port Conflicts
Port 5000 may be occupied by leftover test processes. Kill before starting:
```bash
npx kill-port 5000
```

### Admin Password
Admin account was created with a PHP-generated bcrypt hash (incompatible with bcryptjs). Fixed by regenerating hash using bcryptjs directly. Current credentials:
- Email: `admin@bryge.com`
- Password: `password` ← **CHANGE BEFORE GOING LIVE**

### Paystack Limitations
- No native escrow product — Bryge implements its own
- Manual Payout must be enabled on account by contacting Paystack support
- USD payouts require Zenith Bank domiciliary account
- Once vendor is paid, Paystack cannot reverse funds — vendor must be recovered via ToS

### Digital Products
Hidden from storefront at launch. Admin toggle in Platform Settings. Build foundation exists — just needs the toggle to be flipped when ready.

### Logistics Partner
Not yet confirmed. Admin manually updates delivery status for now. When logistics partner is confirmed, build a webhook receiver to auto-update order statuses from their API.

---

*End of DESIGN.md*  
*This document should be kept updated as new features are built and decisions are made.*