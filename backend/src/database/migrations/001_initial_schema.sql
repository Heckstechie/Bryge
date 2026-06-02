-- =============================================================================
-- Bryge Platform — Complete Database Schema
-- Migration: 001_initial_schema
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy search on products

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin', 'sub_admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending_verification', 'deactivated');
CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'out_of_stock', 'suspended', 'deleted');
CREATE TYPE order_status AS ENUM ('pending', 'payment_processing', 'paid', 'cancelled', 'refunded');
CREATE TYPE vendor_order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped',
  'delivered', 'delivery_confirmed', 'cancelled', 'refunded', 'disputed'
);
CREATE TYPE payment_gateway AS ENUM ('paystack', 'stripe');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE currency_code AS ENUM ('NGN', 'USD');
CREATE TYPE escrow_status AS ENUM ('holding', 'released', 'refunded', 'disputed');
CREATE TYPE wallet_tx_type AS ENUM (
  'escrow_credit',
  'escrow_release',
  'escrow_refund',
  'payout',
  'commission_debit',
  'adjustment'
);
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_customer', 'resolved_vendor', 'closed');
CREATE TYPE dispute_reason AS ENUM (
  'item_not_received', 'item_not_as_described',
  'damaged_item', 'wrong_item', 'other'
);
CREATE TYPE notification_type AS ENUM (
  'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered',
  'payment_received', 'payout_processed', 'payout_failed',
  'escrow_released', 'dispute_opened', 'dispute_resolved', 'dispute_message',
  'review_posted', 'low_stock', 'vendor_approved', 'vendor_rejected', 'system'
);
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed_amount');

-- =============================================================================
-- UTILITY FUNCTION: auto-update updated_at timestamps
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- USERS & AUTH
-- =============================================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(20),
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'customer',
  status          user_status NOT NULL DEFAULT 'active',
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Customer profiles (one-to-one with users where role = customer)
CREATE TABLE customer_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  avatar_url          TEXT,
  date_of_birth       DATE,
  country             VARCHAR(100),
  city                VARCHAR(100),
  preferred_currency  currency_code NOT NULL DEFAULT 'USD',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Vendor profiles
CREATE TABLE vendor_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name           VARCHAR(255) NOT NULL,
  business_description    TEXT,
  business_email          VARCHAR(255),
  business_phone          VARCHAR(20),
  logo_url                TEXT,
  banner_url              TEXT,
  slug                    VARCHAR(255) UNIQUE,
  status                  vendor_status NOT NULL DEFAULT 'pending',
  verified                BOOLEAN NOT NULL DEFAULT FALSE,
  verification_documents  JSONB NOT NULL DEFAULT '[]',
  -- Bank details for Paystack payouts
  bank_name               VARCHAR(100),
  bank_account_number     VARCHAR(20),
  bank_account_name       VARCHAR(255),
  bank_code               VARCHAR(10),
  paystack_recipient_code VARCHAR(100),  -- stored after Paystack transfer recipient creation
  -- Aggregated stats (denormalised for performance)
  total_sales             NUMERIC(15,2) NOT NULL DEFAULT 0,
  rating                  NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count            INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_vendor_profiles_updated_at
  BEFORE UPDATE ON vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Admin profiles (admin + sub_admin roles)
CREATE TABLE admin_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  -- Granular permission flags for sub_admins
  permissions JSONB NOT NULL DEFAULT '{
    "manage_vendors": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_products": false,
    "manage_coupons": false,
    "view_reports": false
  }',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- JWT refresh tokens
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE,
  user_agent  TEXT,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE email_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ADDRESSES
-- =============================================================================

CREATE TABLE addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label           VARCHAR(50),              -- 'home', 'work', 'other'
  recipient_name  VARCHAR(255) NOT NULL,
  phone           VARCHAR(20) NOT NULL,
  address_line1   VARCHAR(255) NOT NULL,
  address_line2   VARCHAR(255),
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(100) NOT NULL,
  country         VARCHAR(100) NOT NULL,
  postal_code     VARCHAR(20),
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enforce only one default address per user
CREATE UNIQUE INDEX idx_addresses_single_default
  ON addresses (user_id)
  WHERE is_default = TRUE;

-- =============================================================================
-- CATEGORIES & COMMISSION RATES
-- =============================================================================

CREATE TABLE categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL UNIQUE,
  slug             VARCHAR(100) NOT NULL UNIQUE,
  description      TEXT,
  image_url        TEXT,
  -- Commission rate applied to all products in this category
  commission_rate  NUMERIC(5,2) NOT NULL DEFAULT 10.00,  -- percent e.g. 10.00 = 10%
  parent_id        UUID REFERENCES categories(id),       -- NULL = top-level
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- PRODUCTS
-- =============================================================================

CREATE TABLE products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  category_id          UUID NOT NULL REFERENCES categories(id),
  name                 VARCHAR(255) NOT NULL,
  slug                 VARCHAR(255) NOT NULL,
  description          TEXT,
  short_description    VARCHAR(500),
  price                NUMERIC(15,2) NOT NULL,               -- always NGN
  compare_price        NUMERIC(15,2),                        -- strike-through price
  cost_price           NUMERIC(15,2),                        -- vendor's cost (private)
  sku                  VARCHAR(100),
  stock_quantity       INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold  INTEGER NOT NULL DEFAULT 5,
  track_inventory      BOOLEAN NOT NULL DEFAULT TRUE,
  weight_kg            NUMERIC(10,3),
  status               product_status NOT NULL DEFAULT 'draft',
  is_featured          BOOLEAN NOT NULL DEFAULT FALSE,
  tags                 TEXT[] NOT NULL DEFAULT '{}',
  -- SEO
  meta_title           VARCHAR(255),
  meta_description     TEXT,
  -- Denormalised stats
  total_sold           INTEGER NOT NULL DEFAULT 0,
  rating               NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count         INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendor_id, slug)
);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    VARCHAR(255),
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product variants (size, color, etc.)
CREATE TABLE product_variants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,   -- e.g. 'Size'
  value             VARCHAR(100) NOT NULL,   -- e.g. 'Large'
  price_adjustment  NUMERIC(15,2) NOT NULL DEFAULT 0,
  stock_quantity    INTEGER NOT NULL DEFAULT 0,
  sku               VARCHAR(100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- CART
-- =============================================================================

CREATE TABLE cart_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id          VARCHAR(255),              -- for guests
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_variant_id  UUID REFERENCES product_variants(id),
  quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A user or session can have each product+variant only once
  CONSTRAINT cart_unique_user_item UNIQUE (user_id, product_id, product_variant_id),
  CONSTRAINT cart_has_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ORDERS
-- Orders split into:
--   orders        → one per checkout (customer view)
--   vendor_orders → one per vendor within that checkout (vendor view + escrow unit)
--   order_items   → individual line items
-- =============================================================================

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES users(id),
  order_number     VARCHAR(50) NOT NULL UNIQUE,    -- e.g. BRG-20240115-0001
  status           order_status NOT NULL DEFAULT 'pending',
  subtotal_ngn     NUMERIC(15,2) NOT NULL,
  shipping_fee_ngn NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_ngn     NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_ngn        NUMERIC(15,2) NOT NULL,
  -- Original currency the customer paid in
  payment_currency currency_code NOT NULL,
  payment_amount   NUMERIC(15,2) NOT NULL,         -- amount in payment_currency
  exchange_rate    NUMERIC(15,6),                  -- NGN per 1 USD at order time; NULL if NGN
  coupon_id        UUID,                           -- FK added after coupons table
  shipping_address JSONB NOT NULL,                 -- snapshot of address at purchase time
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Vendor sub-orders (one per vendor in an order)
CREATE TABLE vendor_orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id),
  vendor_id            UUID NOT NULL REFERENCES vendor_profiles(id),
  status               vendor_order_status NOT NULL DEFAULT 'pending',
  subtotal_ngn         NUMERIC(15,2) NOT NULL,
  shipping_fee_ngn     NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_ngn            NUMERIC(15,2) NOT NULL,
  -- Commission snapshot at order time (category rate may change later)
  commission_rate      NUMERIC(5,2) NOT NULL,
  commission_ngn       NUMERIC(15,2) NOT NULL,
  vendor_payout_ngn    NUMERIC(15,2) NOT NULL,    -- total_ngn - commission_ngn
  -- Escrow / delivery timeline
  shipped_at           TIMESTAMPTZ,
  tracking_number      VARCHAR(255),
  tracking_url         TEXT,
  estimated_delivery   DATE,
  delivered_at         TIMESTAMPTZ,               -- set when vendor marks delivered
  delivery_confirmed_at TIMESTAMPTZ,              -- set when customer confirms
  auto_release_at      TIMESTAMPTZ,               -- delivered_at + 72 hours
  payout_released_at   TIMESTAMPTZ,
  -- Cancellation
  cancelled_at         TIMESTAMPTZ,
  cancellation_reason  TEXT,
  vendor_notes         TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_vendor_orders_updated_at
  BEFORE UPDATE ON vendor_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_order_id     UUID NOT NULL REFERENCES vendor_orders(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  product_variant_id  UUID REFERENCES product_variants(id),
  -- Snapshots: product details at purchase time (immutable)
  product_name        VARCHAR(255) NOT NULL,
  product_image       TEXT,
  variant_details     JSONB,                       -- {name: 'Size', value: 'Large'}
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_ngn      NUMERIC(15,2) NOT NULL,
  total_price_ngn     NUMERIC(15,2) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE payments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               UUID NOT NULL REFERENCES orders(id),
  customer_id            UUID NOT NULL REFERENCES users(id),
  gateway                payment_gateway NOT NULL,
  gateway_reference      VARCHAR(255) NOT NULL UNIQUE,   -- Paystack/Stripe reference
  gateway_transaction_id VARCHAR(255),                   -- internal txn id from gateway
  amount                 NUMERIC(15,2) NOT NULL,         -- in payment currency
  currency               currency_code NOT NULL,
  amount_ngn             NUMERIC(15,2) NOT NULL,         -- converted to NGN
  status                 payment_status NOT NULL DEFAULT 'pending',
  gateway_response       JSONB,                          -- raw webhook/response payload
  paid_at                TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ESCROW
-- One escrow record per vendor_order.
-- Funds move: holding → released (to vendor wallet) OR refunded (to customer).
-- =============================================================================

CREATE TABLE escrow_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_order_id       UUID NOT NULL UNIQUE REFERENCES vendor_orders(id),
  payment_id            UUID NOT NULL REFERENCES payments(id),
  amount_ngn            NUMERIC(15,2) NOT NULL,    -- = vendor_orders.total_ngn
  commission_ngn        NUMERIC(15,2) NOT NULL,
  vendor_payout_ngn     NUMERIC(15,2) NOT NULL,
  status                escrow_status NOT NULL DEFAULT 'holding',
  held_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Who/what triggered the release
  release_trigger       VARCHAR(20),               -- 'customer' | 'auto_72hr' | 'admin' | 'dispute_resolved'
  released_at           TIMESTAMPTZ,
  refunded_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_escrow_transactions_updated_at
  BEFORE UPDATE ON escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- VENDOR WALLETS
-- =============================================================================

CREATE TABLE vendor_wallets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         UUID NOT NULL UNIQUE REFERENCES vendor_profiles(id),
  available_balance NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  on_hold_balance   NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (on_hold_balance >= 0),
  total_earned      NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_withdrawn   NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency          VARCHAR(3) NOT NULL DEFAULT 'NGN',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_vendor_wallets_updated_at
  BEFORE UPDATE ON vendor_wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Immutable ledger of every wallet movement
CREATE TABLE wallet_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id           UUID NOT NULL REFERENCES vendor_wallets(id),
  vendor_order_id     UUID REFERENCES vendor_orders(id),
  payout_request_id   UUID,                        -- FK added after payout_requests table
  type                wallet_tx_type NOT NULL,
  amount              NUMERIC(15,2) NOT NULL,
  -- Snapshot balances before/after for auditability
  available_before    NUMERIC(15,2) NOT NULL,
  available_after     NUMERIC(15,2) NOT NULL,
  on_hold_before      NUMERIC(15,2) NOT NULL,
  on_hold_after       NUMERIC(15,2) NOT NULL,
  description         TEXT,
  reference           VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PAYOUT REQUESTS
-- =============================================================================

CREATE TABLE payout_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            UUID NOT NULL REFERENCES vendor_profiles(id),
  wallet_id            UUID NOT NULL REFERENCES vendor_wallets(id),
  amount               NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  -- Snapshot of bank details at request time
  bank_name            VARCHAR(100) NOT NULL,
  bank_account_number  VARCHAR(20) NOT NULL,
  bank_account_name    VARCHAR(255) NOT NULL,
  bank_code            VARCHAR(10) NOT NULL,
  status               payout_status NOT NULL DEFAULT 'pending',
  gateway_reference    VARCHAR(255),               -- Paystack transfer reference
  gateway_response     JSONB,
  processed_by         UUID REFERENCES users(id),  -- admin who actioned it
  processed_at         TIMESTAMPTZ,
  failure_reason       TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payout_requests_updated_at
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add deferred FK from wallet_transactions → payout_requests
ALTER TABLE wallet_transactions
  ADD CONSTRAINT fk_wallet_tx_payout
  FOREIGN KEY (payout_request_id) REFERENCES payout_requests(id);

-- =============================================================================
-- DISPUTES
-- =============================================================================

CREATE TABLE disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_order_id  UUID NOT NULL REFERENCES vendor_orders(id),
  raised_by        UUID NOT NULL REFERENCES users(id),
  reason           dispute_reason NOT NULL,
  description      TEXT NOT NULL,
  evidence_urls    TEXT[] NOT NULL DEFAULT '{}',
  status           dispute_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by      UUID REFERENCES users(id),
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE dispute_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id   UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES users(id),
  message      TEXT NOT NULL,
  attachments  TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- REVIEWS
-- =============================================================================

CREATE TABLE reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id),
  customer_id       UUID NOT NULL REFERENCES users(id),
  order_item_id     UUID REFERENCES order_items(id),
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             VARCHAR(255),
  body              TEXT,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count     INTEGER NOT NULL DEFAULT 0,
  approved          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One review per customer per order item
  UNIQUE (customer_id, order_item_id)
);

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- COUPONS
-- =============================================================================

CREATE TABLE coupons (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  VARCHAR(50) NOT NULL UNIQUE,
  type                  coupon_type NOT NULL,
  value                 NUMERIC(15,2) NOT NULL CHECK (value > 0),
  minimum_order_amount  NUMERIC(15,2),
  maximum_discount      NUMERIC(15,2),
  usage_limit           INTEGER,                    -- NULL = unlimited
  usage_count           INTEGER NOT NULL DEFAULT 0,
  per_user_limit        INTEGER NOT NULL DEFAULT 1,
  -- Scope: NULL = platform-wide; vendor-specific or category-specific
  vendor_id             UUID REFERENCES vendor_profiles(id),
  category_id           UUID REFERENCES categories(id),
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at            TIMESTAMPTZ,
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE coupon_usages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id        UUID NOT NULL REFERENCES coupons(id),
  user_id          UUID NOT NULL REFERENCES users(id),
  order_id         UUID NOT NULL REFERENCES orders(id),
  discount_ngn     NUMERIC(15,2) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, user_id, order_id)
);

-- Add deferred FK from orders → coupons
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_coupon
  FOREIGN KEY (coupon_id) REFERENCES coupons(id);

-- =============================================================================
-- WISHLISTS
-- =============================================================================

CREATE TABLE wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  data        JSONB NOT NULL DEFAULT '{}',   -- contextual payload (order_id, etc.)
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  action       VARCHAR(100) NOT NULL,         -- e.g. 'vendor.approved', 'order.cancelled'
  entity_type  VARCHAR(100),
  entity_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- users
CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_role         ON users (role);
CREATE INDEX idx_users_status       ON users (status);

-- vendor_profiles
CREATE INDEX idx_vendor_profiles_user_id ON vendor_profiles (user_id);
CREATE INDEX idx_vendor_profiles_status  ON vendor_profiles (status);
CREATE INDEX idx_vendor_profiles_slug    ON vendor_profiles (slug);

-- products
CREATE INDEX idx_products_vendor_id    ON products (vendor_id);
CREATE INDEX idx_products_category_id  ON products (category_id);
CREATE INDEX idx_products_status       ON products (status);
CREATE INDEX idx_products_is_featured  ON products (is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_name_trgm    ON products USING gin (name gin_trgm_ops);  -- fuzzy search
CREATE INDEX idx_products_tags         ON products USING gin (tags);

-- orders
CREATE INDEX idx_orders_customer_id   ON orders (customer_id);
CREATE INDEX idx_orders_order_number  ON orders (order_number);
CREATE INDEX idx_orders_status        ON orders (status);
CREATE INDEX idx_orders_created_at    ON orders (created_at DESC);

-- vendor_orders
CREATE INDEX idx_vendor_orders_order_id   ON vendor_orders (order_id);
CREATE INDEX idx_vendor_orders_vendor_id  ON vendor_orders (vendor_id);
CREATE INDEX idx_vendor_orders_status     ON vendor_orders (status);
-- For the 72hr auto-release cron job
CREATE INDEX idx_vendor_orders_auto_release ON vendor_orders (auto_release_at)
  WHERE status = 'delivered' AND auto_release_at IS NOT NULL;

-- order_items
CREATE INDEX idx_order_items_vendor_order_id  ON order_items (vendor_order_id);
CREATE INDEX idx_order_items_product_id       ON order_items (product_id);

-- payments
CREATE INDEX idx_payments_order_id          ON payments (order_id);
CREATE INDEX idx_payments_gateway_reference ON payments (gateway_reference);
CREATE INDEX idx_payments_status            ON payments (status);

-- escrow_transactions
CREATE INDEX idx_escrow_vendor_order_id ON escrow_transactions (vendor_order_id);
CREATE INDEX idx_escrow_status          ON escrow_transactions (status);

-- vendor_wallets
CREATE INDEX idx_vendor_wallets_vendor_id ON vendor_wallets (vendor_id);

-- wallet_transactions
CREATE INDEX idx_wallet_tx_wallet_id        ON wallet_transactions (wallet_id);
CREATE INDEX idx_wallet_tx_vendor_order_id  ON wallet_transactions (vendor_order_id);
CREATE INDEX idx_wallet_tx_created_at       ON wallet_transactions (created_at DESC);

-- payout_requests
CREATE INDEX idx_payout_requests_vendor_id ON payout_requests (vendor_id);
CREATE INDEX idx_payout_requests_status    ON payout_requests (status);

-- disputes
CREATE INDEX idx_disputes_vendor_order_id ON disputes (vendor_order_id);
CREATE INDEX idx_disputes_raised_by       ON disputes (raised_by);
CREATE INDEX idx_disputes_status          ON disputes (status);

-- reviews
CREATE INDEX idx_reviews_product_id   ON reviews (product_id);
CREATE INDEX idx_reviews_customer_id  ON reviews (customer_id);

-- notifications
CREATE INDEX idx_notifications_user_id     ON notifications (user_id);
CREATE INDEX idx_notifications_unread      ON notifications (user_id, created_at DESC)
  WHERE read = FALSE;

-- audit_logs
CREATE INDEX idx_audit_logs_user_id      ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity       ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at   ON audit_logs (created_at DESC);

-- cart_items
CREATE INDEX idx_cart_items_user_id    ON cart_items (user_id);
CREATE INDEX idx_cart_items_session_id ON cart_items (session_id);

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- wishlists
CREATE INDEX idx_wishlists_user_id ON wishlists (user_id);
