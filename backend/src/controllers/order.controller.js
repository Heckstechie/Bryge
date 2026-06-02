const db = require('../config/database');
const { sendOrderConfirmationEmail } = require('../utils/email');

// ── Mock payment ──────────────────────────────────────────────────────────────
// Simulates a successful Paystack charge.
// Replace this function body with real Paystack API call when keys are ready.

function mockPaystackPayment({ amount, email, currency = 'NGN' }) {
  const reference = `MOCK_PST_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  return {
    success: true,
    reference,
    gateway_response: {
      status:    'success',
      message:   'Mock payment approved',
      reference,
      amount,
      currency,
      paidAt:    new Date().toISOString(),
      channel:   'card',
      card_type: 'mastercard',
    },
  };
}

function mockStripePayment({ amount, email }) {
  const reference = `MOCK_STR_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  return {
    success: true,
    reference,
    gateway_response: {
      status:  'succeeded',
      id:      reference,
      amount,
      currency:'usd',
      created: Math.floor(Date.now() / 1000),
      customer_email: email,
    },
  };
}

// ── Order number generator ────────────────────────────────────────────────────

function generateOrderNumber() {
  const d   = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.floor(Math.random() * 9000000 + 1000000);
  return `BRG-${ymd}-${rnd}`;
}

// ── POST /api/orders — create order ──────────────────────────────────────────

async function createOrder(req, res, next) {
  const {
    shipping_address,
    payment_method = 'paystack',   // 'paystack' | 'stripe'
    coupon_id      = null,
    coupon_discount = 0,
  } = req.body;
  const userId = req.user.id;

  try {
    const result = await db.withTransaction(async (client) => {

      // ── 1. Fetch & validate cart ─────────────────────────────────────────
      const { rows: cartItems } = await client.query(
        `SELECT
           ci.id AS cart_item_id, ci.quantity,
           p.id          AS product_id,
           p.name        AS product_name,
           p.price       AS product_price,
           p.stock_quantity,
           p.status      AS product_status,
           p.vendor_id,
           COALESCE(pv.price_adjustment, 0) AS price_adjustment,
           pv.id         AS variant_id,
           pv.name       AS variant_name,
           pv.value      AS variant_value,
           (SELECT url FROM product_images
            WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS product_image,
           c.id          AS category_id,
           c.commission_rate
         FROM cart_items ci
         JOIN products p         ON p.id  = ci.product_id
         JOIN categories c       ON c.id  = p.category_id
         LEFT JOIN product_variants pv ON pv.id = ci.product_variant_id
         WHERE ci.user_id = $1
         FOR UPDATE OF p`,   // lock product rows to prevent race on stock
        [userId]
      );

      if (cartItems.length === 0) throw new Error('Your cart is empty');

      // Validate stock for every item
      for (const item of cartItems) {
        if (item.product_status !== 'active') {
          throw new Error(`"${item.product_name}" is no longer available`);
        }
        if (item.stock_quantity < item.quantity) {
          throw new Error(`Only ${item.stock_quantity} unit(s) of "${item.product_name}" left in stock`);
        }
      }

      // ── 2. Compute totals ────────────────────────────────────────────────
      const enriched = cartItems.map((item) => ({
        ...item,
        unit_price_ngn:  parseFloat(item.product_price) + parseFloat(item.price_adjustment),
        total_price_ngn: (parseFloat(item.product_price) + parseFloat(item.price_adjustment)) * item.quantity,
      }));

      const subtotal_ngn     = enriched.reduce((s, i) => s + i.total_price_ngn, 0);
      const shipping_fee_ngn = 0;                          // free for now
      const discount_ngn     = Math.min(Number(coupon_discount) || 0, subtotal_ngn);
      const total_ngn        = subtotal_ngn + shipping_fee_ngn - discount_ngn;

      // ── 3. Run mock payment ──────────────────────────────────────────────
      const { rows: [customer] } = await client.query(
        `SELECT u.email, cp.first_name, cp.last_name
         FROM users u JOIN customer_profiles cp ON cp.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );

      const payResult = payment_method === 'stripe'
        ? mockStripePayment({ amount: total_ngn, email: customer.email })
        : mockPaystackPayment({ amount: total_ngn, email: customer.email });

      if (!payResult.success) throw new Error('Payment failed. Please try again.');

      // ── 4. Create master order ───────────────────────────────────────────
      const orderNumber = generateOrderNumber();
      const { rows: [order] } = await client.query(
        `INSERT INTO orders
           (customer_id, order_number, status,
            subtotal_ngn, shipping_fee_ngn, discount_ngn, total_ngn,
            payment_currency, payment_amount, exchange_rate,
            coupon_id, shipping_address)
         VALUES ($1,$2,'paid', $3,$4,$5,$6, $7,$8, NULL, $9,$10)
         RETURNING *`,
        [
          userId, orderNumber,
          subtotal_ngn, shipping_fee_ngn, discount_ngn, total_ngn,
          payment_method === 'stripe' ? 'USD' : 'NGN',
          total_ngn,
          coupon_id || null,
          JSON.stringify(shipping_address),
        ]
      );

      // ── 5. Record payment ────────────────────────────────────────────────
      const { rows: [payment] } = await client.query(
        `INSERT INTO payments
           (order_id, customer_id, gateway, gateway_reference,
            amount, currency, amount_ngn, status, gateway_response, paid_at)
         VALUES ($1,$2,$3,$4, $5,$6,$7,'completed',$8,NOW())
         RETURNING id`,
        [
          order.id, userId,
          payment_method,
          payResult.reference,
          total_ngn,
          payment_method === 'stripe' ? 'USD' : 'NGN',
          total_ngn,
          JSON.stringify(payResult.gateway_response),
        ]
      );

      // ── 6. Split cart into vendor sub-orders ─────────────────────────────
      const vendorGroups = {};
      for (const item of enriched) {
        if (!vendorGroups[item.vendor_id]) vendorGroups[item.vendor_id] = [];
        vendorGroups[item.vendor_id].push(item);
      }

      const vendorOrders = [];

      for (const [vendorId, items] of Object.entries(vendorGroups)) {
        const voSubtotal = items.reduce((s, i) => s + i.total_price_ngn, 0);
        const voShipping = 0;
        const voTotal    = voSubtotal + voShipping;

        // Weighted-average commission rate for this vendor's items
        const commissionRate = items.reduce((s, i) => s + (i.commission_rate * i.total_price_ngn), 0) / voSubtotal;
        const commissionNgn  = items.reduce((s, i) => s + (parseFloat(i.commission_rate) / 100) * i.total_price_ngn, 0);
        const vendorPayout   = voTotal - commissionNgn;

        // Create vendor_order
        const { rows: [vo] } = await client.query(
          `INSERT INTO vendor_orders
             (order_id, vendor_id, status,
              subtotal_ngn, shipping_fee_ngn, total_ngn,
              commission_rate, commission_ngn, vendor_payout_ngn)
           VALUES ($1,$2,'confirmed', $3,$4,$5, $6,$7,$8)
           RETURNING *`,
          [order.id, vendorId, voSubtotal, voShipping, voTotal,
           Math.round(commissionRate * 100) / 100, commissionNgn, vendorPayout]
        );

        // Create order_items
        for (const item of items) {
          await client.query(
            `INSERT INTO order_items
               (vendor_order_id, product_id, product_variant_id,
                product_name, product_image, variant_details,
                quantity, unit_price_ngn, total_price_ngn)
             VALUES ($1,$2,$3, $4,$5,$6, $7,$8,$9)`,
            [
              vo.id, item.product_id, item.variant_id || null,
              item.product_name, item.product_image || null,
              item.variant_name
                ? JSON.stringify({ name: item.variant_name, value: item.variant_value })
                : null,
              item.quantity, item.unit_price_ngn, item.total_price_ngn,
            ]
          );

          // Decrement stock
          await client.query(
            `UPDATE products
             SET stock_quantity = stock_quantity - $1,
                 total_sold = total_sold + $1,
                 status = CASE
                   WHEN stock_quantity - $1 <= 0 THEN 'out_of_stock'::product_status
                   ELSE status
                 END,
                 updated_at = NOW()
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );

          // Update vendor total_sales
          await client.query(
            `UPDATE vendor_profiles SET total_sales = total_sales + $1 WHERE id = $2`,
            [item.total_price_ngn, vendorId]
          );
        }

        // Create escrow record
        await client.query(
          `INSERT INTO escrow_transactions
             (vendor_order_id, payment_id, amount_ngn, commission_ngn, vendor_payout_ngn, status)
           VALUES ($1,$2,$3,$4,$5,'holding')`,
          [vo.id, payment.id, voTotal, commissionNgn, vendorPayout]
        );

        // Add to vendor wallet's on_hold balance
        const { rows: [walletBefore] } = await client.query(
          `SELECT id, available_balance, on_hold_balance
           FROM vendor_wallets WHERE vendor_id = $1`, [vendorId]
        );

        if (walletBefore) {
          await client.query(
            `UPDATE vendor_wallets
             SET on_hold_balance = on_hold_balance + $1,
                 total_earned    = total_earned    + $1,
                 updated_at = NOW()
             WHERE vendor_id = $2`,
            [vendorPayout, vendorId]
          );

          // Wallet transaction ledger entry
          await client.query(
            `INSERT INTO wallet_transactions
               (wallet_id, vendor_order_id, type, amount,
                available_before, available_after,
                on_hold_before,  on_hold_after,
                description, reference)
             VALUES ($1,$2,'escrow_credit',$3, $4,$4, $5,$6, $7,$8)`,
            [
              walletBefore.id, vo.id, vendorPayout,
              parseFloat(walletBefore.available_balance),
              parseFloat(walletBefore.on_hold_balance),
              parseFloat(walletBefore.on_hold_balance) + vendorPayout,
              `Escrow hold for order ${orderNumber}`,
              payResult.reference,
            ]
          );
        }

        vendorOrders.push(vo);
      }

      // ── 7. Mark coupon used ──────────────────────────────────────────────
      if (coupon_id && discount_ngn > 0) {
        await client.query(
          `UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1`, [coupon_id]
        );
        await client.query(
          `INSERT INTO coupon_usages (coupon_id, user_id, order_id, discount_ngn)
           VALUES ($1,$2,$3,$4)`,
          [coupon_id, userId, order.id, discount_ngn]
        );
      }

      // ── 8. Clear cart ────────────────────────────────────────────────────
      await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

      // ── 9. Audit log ─────────────────────────────────────────────────────
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
         VALUES ($1,'order.created','orders',$2,$3)`,
        [userId, order.id, JSON.stringify({ order_number: orderNumber, total_ngn, payment_method })]
      );

      return {
        order:         { ...order, status: 'paid' },
        vendor_orders: vendorOrders,
        payment:       { reference: payResult.reference, gateway: payment_method },
        customer,
      };
    });

    // ── 10. Send confirmation email (non-blocking) ───────────────────────
    sendOrderConfirmationEmail({
      email:        result.customer.email,
      first_name:   result.customer.first_name,
      order_number: result.order.order_number,
      total_ngn:    result.order.total_ngn,
    }).catch(() => {});

    return res.status(201).json({ success: true, order_id: result.order.id, ...result });
  } catch (err) {
    // Return user-friendly messages for known business errors
    if (['Cart is empty', 'Only', 'Payment failed', 'no longer available']
        .some((s) => err.message?.startsWith(s))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

// ── GET /api/orders — customer order history ──────────────────────────────────

async function getOrders(req, res, next) {
  const { page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const userId = req.user.id;

  try {
    const { rows: orders } = await db.query(
      `SELECT
         o.id, o.order_number, o.status, o.total_ngn,
         o.payment_currency, o.created_at,
         COUNT(DISTINCT vo.id) AS vendor_count,
         COUNT(oi.id)          AS item_count,
         (SELECT oi2.product_image
          FROM vendor_orders vo2
          JOIN order_items oi2 ON oi2.vendor_order_id = vo2.id
          WHERE vo2.order_id = o.id LIMIT 1) AS first_image
       FROM orders o
       LEFT JOIN vendor_orders vo ON vo.order_id = o.id
       LEFT JOIN order_items oi   ON oi.vendor_order_id = vo.id
       WHERE o.customer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, Number(limit), offset]
    );

    return res.json({ success: true, orders });
  } catch (err) { next(err); }
}

// ── GET /api/orders/:id — single order detail ─────────────────────────────────

async function getOrder(req, res, next) {
  const { id }  = req.params;
  const userId  = req.user.id;

  try {
    const { rows: [order] } = await db.query(
      `SELECT o.*, p.gateway, p.gateway_reference, p.paid_at,
              p.gateway_response->>'card_type' AS card_type
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
       WHERE o.id = $1 AND o.customer_id = $2`,
      [id, userId]
    );

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { rows: vendorOrders } = await db.query(
      `SELECT vo.*, vp.business_name
       FROM vendor_orders vo
       JOIN vendor_profiles vp ON vp.id = vo.vendor_id
       WHERE vo.order_id = $1`,
      [id]
    );

    // Attach order items to each vendor_order
    for (const vo of vendorOrders) {
      const { rows: items } = await db.query(
        `SELECT * FROM order_items WHERE vendor_order_id = $1`, [vo.id]
      );
      vo.items = items;
    }

    return res.json({ success: true, order, vendor_orders: vendorOrders });
  } catch (err) { next(err); }
}

module.exports = { createOrder, getOrders, getOrder };
