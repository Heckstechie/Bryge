const db = require('../config/database');

// ── Shared cart query ─────────────────────────────────────────────────────────

const CART_SELECT = `
  SELECT
    ci.id, ci.quantity, ci.created_at,
    p.id           AS product_id,
    p.name         AS product_name,
    p.price        AS product_price,
    p.stock_quantity,
    p.status       AS product_status,
    pv.id          AS variant_id,
    pv.name        AS variant_name,
    pv.value       AS variant_value,
    COALESCE(pv.price_adjustment, 0) AS price_adjustment,
    vp.id          AS vendor_id,
    vp.business_name,
    (SELECT url FROM product_images
     WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS primary_image
  FROM cart_items ci
  JOIN products p       ON p.id  = ci.product_id
  JOIN vendor_profiles vp ON vp.id = p.vendor_id
  LEFT JOIN product_variants pv ON pv.id = ci.product_variant_id
  WHERE ci.user_id = $1
  ORDER BY ci.created_at ASC
`;

function enrichCart(rows) {
  const items = rows.map((r) => ({
    id:            r.id,
    quantity:      r.quantity,
    product_id:    r.product_id,
    product_name:  r.product_name,
    primary_image: r.primary_image,
    vendor_id:     r.vendor_id,
    business_name: r.business_name,
    variant_id:    r.variant_id   || null,
    variant_name:  r.variant_name || null,
    variant_value: r.variant_value|| null,
    unit_price:    parseFloat(r.product_price) + parseFloat(r.price_adjustment),
    subtotal:     (parseFloat(r.product_price) + parseFloat(r.price_adjustment)) * r.quantity,
    in_stock:      r.stock_quantity >= r.quantity && r.product_status === 'active',
  }));

  const subtotal      = items.reduce((s, i) => s + i.subtotal, 0);
  const shipping_fee  = 0;      // free shipping (update when shipping logic added)
  const total         = subtotal + shipping_fee;

  return { items, subtotal, shipping_fee, total };
}

// ── GET /api/cart ─────────────────────────────────────────────────────────────

async function getCart(req, res, next) {
  try {
    const { rows } = await db.query(CART_SELECT, [req.user.id]);
    return res.json({ success: true, ...enrichCart(rows) });
  } catch (err) { next(err); }
}

// ── POST /api/cart/add ────────────────────────────────────────────────────────

async function addToCart(req, res, next) {
  const { product_id, product_variant_id = null, quantity = 1 } = req.body;
  const userId = req.user.id;

  try {
    // Verify product is purchasable
    const { rows: [product] } = await db.query(
      `SELECT id, stock_quantity, status FROM products WHERE id = $1`, [product_id]
    );
    if (!product || product.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Product not available' });
    }

    // Check for existing cart item (upsert)
    const { rows: [existing] } = await db.query(
      `SELECT id, quantity FROM cart_items
       WHERE user_id = $1 AND product_id = $2
         AND (product_variant_id = $3 OR (product_variant_id IS NULL AND $3 IS NULL))`,
      [userId, product_id, product_variant_id]
    );

    const newQty = existing ? existing.quantity + Number(quantity) : Number(quantity);

    if (newQty > product.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock_quantity} unit(s) available`,
      });
    }

    if (existing) {
      await db.query(
        `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`,
        [newQty, existing.id]
      );
    } else {
      await db.query(
        `INSERT INTO cart_items (user_id, product_id, product_variant_id, quantity)
         VALUES ($1, $2, $3, $4)`,
        [userId, product_id, product_variant_id, Number(quantity)]
      );
    }

    const { rows } = await db.query(CART_SELECT, [userId]);
    return res.status(201).json({ success: true, message: 'Added to cart', ...enrichCart(rows) });
  } catch (err) { next(err); }
}

// ── PUT /api/cart/:itemId ─────────────────────────────────────────────────────

async function updateCartItem(req, res, next) {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
  }

  try {
    const { rows: [item] } = await db.query(
      `SELECT ci.id, p.stock_quantity
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [itemId, userId]
    );
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found' });

    if (Number(quantity) > item.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${item.stock_quantity} unit(s) available`,
      });
    }

    await db.query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`,
      [Number(quantity), itemId]
    );

    const { rows } = await db.query(CART_SELECT, [userId]);
    return res.json({ success: true, ...enrichCart(rows) });
  } catch (err) { next(err); }
}

// ── DELETE /api/cart/:itemId ──────────────────────────────────────────────────

async function removeCartItem(req, res, next) {
  const { itemId } = req.params;
  const userId = req.user.id;

  try {
    const { rowCount } = await db.query(
      `DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, [itemId, userId]
    );
    if (!rowCount) return res.status(404).json({ success: false, message: 'Cart item not found' });

    const { rows } = await db.query(CART_SELECT, [userId]);
    return res.json({ success: true, ...enrichCart(rows) });
  } catch (err) { next(err); }
}

// ── DELETE /api/cart ──────────────────────────────────────────────────────────

async function clearCart(req, res, next) {
  try {
    await db.query(`DELETE FROM cart_items WHERE user_id = $1`, [req.user.id]);
    return res.json({ success: true, items: [], subtotal: 0, shipping_fee: 0, total: 0 });
  } catch (err) { next(err); }
}

// ── POST /api/cart/apply-coupon ───────────────────────────────────────────────

async function applyCoupon(req, res, next) {
  const { code } = req.body;
  const userId   = req.user.id;

  try {
    const { rows: [coupon] } = await db.query(
      `SELECT * FROM coupons
       WHERE UPPER(code) = UPPER($1) AND active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (usage_limit IS NULL OR usage_count < usage_limit)`,
      [code]
    );
    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired promo code' });
    }

    // Check per-user usage
    const { rows: [used] } = await db.query(
      `SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2`,
      [coupon.id, userId]
    );
    if (Number(used.cnt) >= coupon.per_user_limit) {
      return res.status(400).json({ success: false, message: 'You have already used this promo code' });
    }

    // Get cart total to validate minimum
    const { rows } = await db.query(CART_SELECT, [userId]);
    const { subtotal } = enrichCart(rows);

    if (coupon.minimum_order_amount && subtotal < parseFloat(coupon.minimum_order_amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order of ₦${Number(coupon.minimum_order_amount).toLocaleString()} required`,
      });
    }

    let discount = coupon.type === 'percentage'
      ? (subtotal * parseFloat(coupon.value)) / 100
      : parseFloat(coupon.value);

    if (coupon.maximum_discount) {
      discount = Math.min(discount, parseFloat(coupon.maximum_discount));
    }

    return res.json({
      success: true,
      coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value },
      discount: Math.round(discount * 100) / 100,
    });
  } catch (err) { next(err); }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart, applyCoupon };
