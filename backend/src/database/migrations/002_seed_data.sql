-- =============================================================================
-- Bryge Platform — Seed Data
-- Migration: 002_seed_data
-- =============================================================================

-- =============================================================================
-- CATEGORIES (Nigerian product categories with commission rates)
-- Commission logic:
--   Food & Groceries  → 8%  (high volume, low margin)
--   Fashion & Apparel → 12%
--   Beauty & Personal → 12%
--   Electronics       → 6%  (low margin items)
--   Home & Living     → 10%
--   Arts & Crafts     → 15% (handmade / artisan premium)
--   Health & Wellness → 10%
--   Books & Media     → 10%
-- =============================================================================

INSERT INTO categories (id, name, slug, description, commission_rate, sort_order) VALUES
  (gen_random_uuid(), 'Food & Groceries',     'food-groceries',     'Authentic Nigerian food, spices, condiments, and pantry staples',         8.00,  1),
  (gen_random_uuid(), 'Fashion & Apparel',    'fashion-apparel',    'Ankara, Aso-oke, Agbada, traditional and modern Nigerian fashion',        12.00,  2),
  (gen_random_uuid(), 'Beauty & Personal Care','beauty-personal-care','Nigerian skincare, haircare, and beauty products',                       12.00,  3),
  (gen_random_uuid(), 'Electronics',          'electronics',        'Consumer electronics and accessories',                                     6.00,  4),
  (gen_random_uuid(), 'Home & Living',        'home-living',        'Home decor, furniture, kitchenware, and household items',                 10.00,  5),
  (gen_random_uuid(), 'Arts & Crafts',        'arts-crafts',        'Handmade Nigerian art, sculptures, beadwork, and traditional crafts',     15.00,  6),
  (gen_random_uuid(), 'Health & Wellness',    'health-wellness',    'Herbal remedies, vitamins, and wellness products',                        10.00,  7),
  (gen_random_uuid(), 'Books & Media',        'books-media',        'Nigerian literature, Nollywood, music, and educational content',          10.00,  8);


-- Sub-categories: Food & Groceries
WITH parent AS (SELECT id FROM categories WHERE slug = 'food-groceries')
INSERT INTO categories (id, name, slug, description, commission_rate, parent_id, sort_order)
SELECT
  gen_random_uuid(), sub.name, sub.slug, sub.description, 8.00, parent.id, sub.sort_order
FROM parent, (VALUES
  ('Spices & Seasoning',  'spices-seasoning',  'Suya spice, egusi, ogiri, crayfish, and more',  1),
  ('Palm Oil & Oils',     'palm-oil-oils',     'Red palm oil, coconut oil, groundnut oil',       2),
  ('Grains & Legumes',    'grains-legumes',    'Beans, rice, millet, sorghum',                  3),
  ('Soups & Stews',       'soups-stews',       'Ogbono, banga, egusi soup bases',               4),
  ('Snacks & Confections','snacks-confections','Puff puff, chin chin, plantain chips',           5)
) AS sub(name, slug, description, sort_order);

-- Sub-categories: Fashion & Apparel
WITH parent AS (SELECT id FROM categories WHERE slug = 'fashion-apparel')
INSERT INTO categories (id, name, slug, description, commission_rate, parent_id, sort_order)
SELECT
  gen_random_uuid(), sub.name, sub.slug, sub.description, 12.00, parent.id, sub.sort_order
FROM parent, (VALUES
  ('Ankara & Prints',   'ankara-prints',   'Ankara fabric and ready-to-wear Ankara outfits', 1),
  ('Traditional Wear',  'traditional-wear','Agbada, buba, iro, soro, guinea brocade',         2),
  ('Footwear',          'footwear',        'Hand-crafted Nigerian sandals and shoes',          3),
  ('Accessories',       'accessories',     'Beaded jewelry, gele, headties, bags',            4)
) AS sub(name, slug, description, sort_order);

-- Sub-categories: Beauty & Personal Care
WITH parent AS (SELECT id FROM categories WHERE slug = 'beauty-personal-care')
INSERT INTO categories (id, name, slug, description, commission_rate, parent_id, sort_order)
SELECT
  gen_random_uuid(), sub.name, sub.slug, sub.description, 12.00, parent.id, sub.sort_order
FROM parent, (VALUES
  ('Skincare',       'skincare',       'Black soap, shea butter, natural skincare',       1),
  ('Haircare',       'haircare',       'Shea butter, hair oils, natural hair products',   2),
  ('Fragrances',     'fragrances',     'Nigerian-made perfumes and body mists',           3),
  ('Cosmetics',      'cosmetics',      'Makeup and cosmetics for all skin tones',        4)
) AS sub(name, slug, description, sort_order);


-- =============================================================================
-- ADMIN USER (default superadmin — password should be changed immediately)
-- Password: Admin@Bryge2024  (bcrypt hash — 12 rounds)
-- =============================================================================

DO $$
DECLARE
  v_admin_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO users (id, email, phone, password_hash, role, status, email_verified)
  VALUES (
    v_admin_id,
    'admin@bryge.com',
    NULL,
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8VtJpP0yRm.XjV3UVWS', -- Admin@Bryge2024
    'admin',
    'active',
    TRUE
  );

  INSERT INTO admin_profiles (user_id, first_name, last_name, permissions)
  VALUES (
    v_admin_id,
    'Bryge',
    'Admin',
    '{
      "manage_vendors": true,
      "manage_orders": true,
      "manage_disputes": true,
      "manage_payouts": true,
      "manage_products": true,
      "manage_coupons": true,
      "view_reports": true
    }'
  );
END $$;
