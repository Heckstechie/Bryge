const db = require('../config/database');
const {
  sendVendorApprovedEmail,
  sendVendorRejectedEmail,
  sendDisputeResolvedEmail,
  sendPayoutProcessingEmail,
  sendPayoutCompletedEmail,
} = require('../utils/email');

// ── Helper: format vendor ID ───────────────────────────────────────────────────
function fmtVendorId(rowNum) {
  return `BRY${String(rowNum).padStart(5, '0')}`;
}

// ── GET /api/admin/overview ───────────────────────────────────────────────────

async function getOverview(req, res, next) {
  try {
    // Revenue from completed payments
    const revenueResult = await db.query(
      `SELECT COALESCE(SUM(o.total_ngn), 0) AS total_revenue,
              COALESCE(SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days'
                           THEN o.total_ngn ELSE 0 END), 0) AS revenue_30d
       FROM orders o WHERE o.status = 'paid'`
    );

    // Order counts
    const orderResult = await db.query(
      `SELECT COUNT(*) AS total_orders,
              COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS orders_30d
       FROM orders`
    );

    // Vendor counts (vendor_status: pending, active, suspended, rejected)
    const vendorResult = await db.query(
      `SELECT COUNT(*) AS total_vendors,
              COUNT(CASE WHEN status = 'pending'   THEN 1 END) AS pending_vendors,
              COUNT(CASE WHEN status = 'active'    THEN 1 END) AS active_vendors,
              COUNT(CASE WHEN status = 'suspended' THEN 1 END) AS suspended_vendors
       FROM vendor_profiles`
    );

    // Customer count
    const customerResult = await db.query(
      `SELECT COUNT(*) AS total_customers FROM users WHERE role = 'customer'`
    );

    // Recent orders (last 10)
    const recentOrders = await db.query(
      `SELECT o.id, o.order_number, o.created_at, o.status,
              o.total_ngn,
              cp.first_name AS customer_first, cp.last_name AS customer_last,
              u.email AS customer_email,
              COUNT(DISTINCT oi.id) AS item_count
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       LEFT JOIN vendor_orders vo ON vo.order_id = o.id
       LEFT JOIN order_items oi ON oi.vendor_order_id = vo.id
       GROUP BY o.id, cp.first_name, cp.last_name, u.email
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    // Recent vendor applications (last 5)
    const recentApplications = await db.query(
      `SELECT vp.id, vp.business_name, vp.status, vp.created_at, u.email
       FROM vendor_profiles vp
       JOIN users u ON vp.user_id = u.id
       ORDER BY vp.created_at DESC
       LIMIT 5`
    );

    // Revenue by month (last 6 months)
    const revenueChart = await db.query(
      `SELECT DATE_TRUNC('month', created_at) AS month,
              COALESCE(SUM(total_ngn), 0) AS revenue
       FROM orders
       WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY 1 ORDER BY 1 ASC`
    );

    // Orders by status
    const ordersByStatus = await db.query(
      `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
    );

    // Open disputes count
    const disputesResult = await db.query(
      `SELECT COUNT(*) AS open_disputes FROM disputes WHERE status = 'open'`
    );

    res.json({
      stats: {
        total_revenue:    Number(revenueResult.rows[0].total_revenue),
        revenue_30d:      Number(revenueResult.rows[0].revenue_30d),
        total_orders:     Number(orderResult.rows[0].total_orders),
        orders_30d:       Number(orderResult.rows[0].orders_30d),
        total_vendors:    Number(vendorResult.rows[0].total_vendors),
        pending_vendors:  Number(vendorResult.rows[0].pending_vendors),
        active_vendors:   Number(vendorResult.rows[0].active_vendors),
        suspended_vendors:Number(vendorResult.rows[0].suspended_vendors),
        total_customers:  Number(customerResult.rows[0].total_customers),
        open_disputes:    Number(disputesResult.rows[0].open_disputes),
      },
      recent_orders:       recentOrders.rows,
      recent_applications: recentApplications.rows,
      revenue_chart:       revenueChart.rows,
      orders_by_status:    ordersByStatus.rows,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/orders ─────────────────────────────────────────────────────

async function getOrders(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`o.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(o.order_number ILIKE $${params.length}
          OR cp.first_name ILIKE $${params.length}
          OR cp.last_name  ILIKE $${params.length}
          OR u.email       ILIKE $${params.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(DISTINCT o.id) AS total
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       ${where}`,
      params
    );
    const total = Number(countResult.rows[0].total);

    params.push(Number(limit), offset);
    const rows = await db.query(
      `SELECT o.id, o.order_number, o.created_at, o.status,
              o.total_ngn, o.subtotal_ngn, o.shipping_fee_ngn,
              cp.first_name AS customer_first, cp.last_name AS customer_last,
              u.email AS customer_email,
              COUNT(DISTINCT oi.id) AS item_count,
              COUNT(DISTINCT vo.vendor_id) AS vendor_count,
              EXISTS(
                SELECT 1 FROM disputes d
                JOIN vendor_orders vo2 ON vo2.id = d.vendor_order_id
                WHERE vo2.order_id = o.id AND d.status = 'open'
              ) AS has_open_dispute
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       LEFT JOIN vendor_orders vo ON vo.order_id = o.id
       LEFT JOIN order_items oi ON oi.vendor_order_id = vo.id
       ${where}
       GROUP BY o.id, cp.first_name, cp.last_name, u.email
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      orders: rows.rows,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/orders/:id ─────────────────────────────────────────────────

async function getOrder(req, res, next) {
  try {
    const { id } = req.params;

    const orderResult = await db.query(
      `SELECT o.*,
              cp.first_name AS customer_first, cp.last_name AS customer_last,
              u.email AS customer_email, u.phone AS customer_phone
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );
    if (!orderResult.rows.length) return res.status(404).json({ message: 'Order not found' });
    const order = orderResult.rows[0];

    // Vendor sub-orders with items
    const voResult = await db.query(
      `SELECT vo.id, vo.vendor_id, vo.status, vo.subtotal_ngn, vo.total_ngn,
              vo.commission_rate, vo.commission_ngn, vo.vendor_payout_ngn,
              vo.tracking_number, vo.shipped_at, vo.delivered_at,
              vp.business_name AS vendor_name,
              u2.email AS vendor_email
       FROM vendor_orders vo
       JOIN vendor_profiles vp ON vp.id = vo.vendor_id
       JOIN users u2 ON u2.id = vp.user_id
       WHERE vo.order_id = $1
       ORDER BY vo.id`,
      [id]
    );

    const itemsResult = await db.query(
      `SELECT oi.id, oi.vendor_order_id, oi.product_id, oi.product_name,
              oi.product_image, oi.variant_details, oi.quantity,
              oi.unit_price_ngn, oi.total_price_ngn
       FROM order_items oi
       JOIN vendor_orders vo ON vo.id = oi.vendor_order_id
       WHERE vo.order_id = $1
       ORDER BY oi.vendor_order_id, oi.id`,
      [id]
    );

    const vendorOrders = voResult.rows.map((vo) => ({
      ...vo,
      items: itemsResult.rows.filter((i) => i.vendor_order_id === vo.id),
    }));

    // Dispute (linked via vendor_order)
    const disputeResult = await db.query(
      `SELECT d.*,
              cp.first_name AS customer_first, cp.last_name AS customer_last,
              u.email AS customer_email
       FROM disputes d
       JOIN vendor_orders vo ON vo.id = d.vendor_order_id
       JOIN users u ON u.id = d.raised_by
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE vo.order_id = $1
       ORDER BY d.created_at DESC
       LIMIT 1`,
      [id]
    );

    // Escrow records
    const escrowResult = await db.query(
      `SELECT e.id, e.vendor_order_id, e.amount_ngn, e.commission_ngn,
              e.vendor_payout_ngn, e.status, e.held_at, e.released_at
       FROM escrow_transactions e
       JOIN vendor_orders vo ON vo.id = e.vendor_order_id
       WHERE vo.order_id = $1`,
      [id]
    );

    // Payment info
    const paymentResult = await db.query(
      `SELECT gateway, gateway_reference, amount, currency, status AS payment_status, paid_at
       FROM payments WHERE order_id = $1 LIMIT 1`,
      [id]
    );

    res.json({
      order,
      vendor_orders: vendorOrders,
      dispute:  disputeResult.rows[0] || null,
      escrow:   escrowResult.rows,
      payment:  paymentResult.rows[0] || null,
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/orders/:orderId/vendor-orders/:voId/status ───────────────

async function updateVendorOrderStatus(req, res, next) {
  try {
    const { orderId, voId } = req.params;
    const { status, tracking_number } = req.body;

    const allowed = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const sets = ['status = $1', 'updated_at = NOW()'];
    const params = [status];

    if (tracking_number) {
      params.push(tracking_number);
      sets.push(`tracking_number = $${params.length}`);
    }
    if (status === 'shipped') sets.push('shipped_at = NOW()');
    if (status === 'delivered') sets.push('delivered_at = NOW()');

    params.push(voId, orderId);
    const result = await db.query(
      `UPDATE vendor_orders SET ${sets.join(', ')}
       WHERE id = $${params.length - 1} AND order_id = $${params.length}
       RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Vendor order not found' });

    res.json({ vendor_order: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/disputes ───────────────────────────────────────────────────

async function getDisputes(req, res, next) {
  try {
    const { status = 'open', page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Stats cards
    const statsResult = await db.query(
      `SELECT
         COUNT(CASE WHEN status = 'open' THEN 1 END) AS open_count,
         COUNT(CASE WHEN status = 'under_review' THEN 1 END) AS under_review_count,
         COUNT(CASE WHEN status IN ('resolved_customer','resolved_vendor','closed')
                    AND resolved_at >= date_trunc('month', NOW()) THEN 1 END) AS resolved_this_month
       FROM disputes`
    );

    const params = [];
    const conditions = [];

    if (status === 'open') {
      conditions.push(`d.status = 'open'`);
    } else if (status === 'under_review') {
      conditions.push(`d.status = 'under_review'`);
    } else if (status === 'resolved') {
      conditions.push(`d.status IN ('resolved_customer', 'resolved_vendor', 'closed')`);
    }

    if (search) {
      params.push(`%${search}%`);
      const n = params.length;
      conditions.push(`(o.order_number ILIKE $${n} OR u.email ILIKE $${n} OR vp.business_name ILIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM disputes d
       JOIN vendor_orders vo ON vo.id = d.vendor_order_id
       JOIN orders o ON o.id = vo.order_id
       JOIN users u ON u.id = d.raised_by
       JOIN vendor_profiles vp ON vp.id = vo.vendor_id
       ${where}`, params
    );
    const total = Number(countResult.rows[0].total);

    params.push(Number(limit), offset);
    const rows = await db.query(
      `SELECT d.id, d.vendor_order_id, d.reason, d.status, d.created_at, d.resolved_at,
              o.id AS order_id, o.order_number, o.total_ngn,
              cp.first_name, cp.last_name, u.email AS customer_email,
              vp.business_name AS vendor_name,
              ROW_NUMBER() OVER (ORDER BY d.created_at) AS row_num
       FROM disputes d
       JOIN vendor_orders vo ON vo.id = d.vendor_order_id
       JOIN orders o ON o.id = vo.order_id
       JOIN users u ON u.id = d.raised_by
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       JOIN vendor_profiles vp ON vp.id = vo.vendor_id
       ${where}
       ORDER BY d.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const disputes = rows.rows.map((d) => ({
      ...d,
      dispute_number: `DIS-${String(d.row_num).padStart(3, '0')}`,
    }));

    res.json({
      disputes,
      stats: statsResult.rows[0],
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/disputes/:id/review ─────────────────────────────────────

async function startReview(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE disputes SET status = 'under_review', updated_at = NOW()
       WHERE id = $1 AND status = 'open'
       RETURNING *`,
      [id]
    );
    if (!result.rows.length) return res.status(400).json({ message: 'Dispute not found or already under review' });
    res.json({ dispute: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/disputes/:id ───────────────────────────────────────────────

async function getDispute(req, res, next) {
  try {
    const { id } = req.params;

    // Get all dispute rows with a global row_number for DIS-XXX format
    const result = await db.query(
      `SELECT d.id, d.reason, d.description, d.evidence_urls, d.status,
              d.resolution_notes, d.resolved_by, d.resolved_at,
              d.created_at, d.updated_at,
              o.id AS order_id, o.order_number, o.total_ngn AS order_total,
              vo.id AS vendor_order_id, vo.vendor_payout_ngn,
              vp.business_name AS vendor_name,
              cp.first_name AS customer_first, cp.last_name AS customer_last,
              u_cust.email AS customer_email,
              u_admin.email AS resolved_by_email,
              ROW_NUMBER() OVER (ORDER BY d.created_at) AS row_num
       FROM disputes d
       JOIN vendor_orders vo ON vo.id = d.vendor_order_id
       JOIN orders o ON o.id = vo.order_id
       JOIN vendor_profiles vp ON vp.id = vo.vendor_id
       JOIN users u_cust ON u_cust.id = d.raised_by
       LEFT JOIN customer_profiles cp ON cp.user_id = u_cust.id
       LEFT JOIN users u_admin ON u_admin.id = d.resolved_by
       WHERE d.id = $1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Dispute not found' });

    const d = result.rows[0];
    const dispute = {
      ...d,
      dispute_number: `DIS-${String(d.row_num).padStart(3, '0')}`,
      customer_name:  [d.customer_first, d.customer_last].filter(Boolean).join(' ') || d.customer_email,
    };
    res.json({ dispute });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/disputes/:id/note ────────────────────────────────────────

async function updateDisputeNote(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const result = await db.query(
      `UPDATE disputes SET resolution_notes = $1, updated_at = NOW()
       WHERE id = $2 AND status IN ('open', 'under_review')
       RETURNING *`,
      [note, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Dispute not found or already resolved' });
    res.json({ dispute: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/disputes/:disputeId/resolve ───────────────────────────────

async function resolveDispute(req, res, next) {
  try {
    const { id: disputeId } = req.params;
    const { resolution, resolution_notes } = req.body;
    // resolution: 'release_to_vendor' | 'refund_customer'

    if (!['release_to_vendor', 'refund_customer'].includes(resolution)) {
      return res.status(400).json({ message: 'Invalid resolution' });
    }

    const adminId = req.user.id;
    const newStatus = resolution === 'release_to_vendor' ? 'resolved_vendor' : 'resolved_customer';

    await db.withTransaction(async (client) => {
      // Fetch dispute + its vendor_order
      const disputeRes = await client.query(
        `SELECT d.*, vo.id AS vo_id, vo.vendor_id
         FROM disputes d
         JOIN vendor_orders vo ON vo.id = d.vendor_order_id
         WHERE d.id = $1 AND d.status IN ('open', 'under_review')`,
        [disputeId]
      );
      if (!disputeRes.rows.length) {
        const e = new Error('Dispute not found or already resolved'); e.status = 404; throw e;
      }
      const dispute = disputeRes.rows[0];
      const voId     = dispute.vo_id;
      const vendorId = dispute.vendor_id; // vendor_profiles.id

      // Update dispute
      await client.query(
        `UPDATE disputes
         SET status = $1, resolution_notes = $2, resolved_by = $3, resolved_at = NOW(), updated_at = NOW()
         WHERE id = $4`,
        [newStatus, resolution_notes || null, adminId, disputeId]
      );

      // Fetch escrow for this vendor_order
      const escrowRes = await client.query(
        `SELECT * FROM escrow_transactions WHERE vendor_order_id = $1 AND status = 'holding'`,
        [voId]
      );

      for (const esc of escrowRes.rows) {
        if (resolution === 'release_to_vendor') {
          // Release escrow — credit vendor available balance
          await client.query(
            `UPDATE escrow_transactions SET status = 'released', released_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [esc.id]
          );
          // Get wallet snapshot for audit
          const wRes = await client.query(
            `UPDATE vendor_wallets
             SET available_balance = available_balance + $1,
                 on_hold_balance   = GREATEST(0, on_hold_balance - $1),
                 total_earned      = total_earned + $1,
                 updated_at        = NOW()
             WHERE vendor_id = $2
             RETURNING id, available_balance, on_hold_balance`,
            [esc.vendor_payout_ngn, vendorId]
          );
          if (wRes.rows.length) {
            const w = wRes.rows[0];
            await client.query(
              `INSERT INTO wallet_transactions
                 (wallet_id, vendor_order_id, type, amount,
                  available_before, available_after, on_hold_before, on_hold_after, description, reference)
               VALUES ($1, $2, 'escrow_release', $3,
                 $4, $5, $6, $7, $8, $9)`,
              [
                w.id, voId, esc.vendor_payout_ngn,
                Number(w.available_balance) - Number(esc.vendor_payout_ngn),
                w.available_balance,
                Number(w.on_hold_balance) + Number(esc.vendor_payout_ngn),
                w.on_hold_balance,
                'Dispute resolved — released to vendor',
                `DISP_REL_${disputeId}`,
              ]
            );
          }
        } else {
          // Refund customer — remove from escrow & vendor on_hold
          await client.query(
            `UPDATE escrow_transactions SET status = 'refunded', released_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [esc.id]
          );
          const wRes = await client.query(
            `UPDATE vendor_wallets
             SET on_hold_balance = GREATEST(0, on_hold_balance - $1), updated_at = NOW()
             WHERE vendor_id = $2
             RETURNING id, available_balance, on_hold_balance`,
            [esc.vendor_payout_ngn, vendorId]
          );
          if (wRes.rows.length) {
            const w = wRes.rows[0];
            await client.query(
              `INSERT INTO wallet_transactions
                 (wallet_id, vendor_order_id, type, amount,
                  available_before, available_after, on_hold_before, on_hold_after, description, reference)
               VALUES ($1, $2, 'escrow_refund', $3,
                 $4, $4, $5, $6, $7, $8)`,
              [
                w.id, voId, esc.vendor_payout_ngn,
                w.available_balance,
                Number(w.on_hold_balance) + Number(esc.vendor_payout_ngn),
                w.on_hold_balance,
                'Dispute resolved — customer refunded',
                `DISP_RFD_${disputeId}`,
              ]
            );
          }
        }
      }
    });

    // ── Send resolution emails to both parties (non-blocking) ─────────────
    db.query(
      `SELECT d.id,
              o.order_number,
              u_cust.email AS customer_email, cp.first_name AS customer_first,
              u_vend.email AS vendor_email,   vp.business_name
       FROM disputes d
       JOIN vendor_orders vo ON vo.id = d.vendor_order_id
       JOIN orders o         ON o.id  = vo.order_id
       JOIN users u_cust     ON u_cust.id = d.raised_by
       JOIN customer_profiles cp ON cp.user_id = u_cust.id
       JOIN vendor_profiles vp   ON vp.id = vo.vendor_id
       JOIN users u_vend     ON u_vend.id = vp.user_id
       WHERE d.id = $1`,
      [disputeId]
    ).then(({ rows }) => {
      if (!rows.length) return;
      const r = rows[0];
      const args = { order_number: r.order_number, outcome: resolution, resolution_notes };
      sendDisputeResolvedEmail({ ...args, email: r.customer_email, name: r.customer_first || 'there', role: 'customer' }).catch(() => {});
      sendDisputeResolvedEmail({ ...args, email: r.vendor_email,   name: r.business_name,              role: 'vendor'   }).catch(() => {});
    });

    res.json({ message: 'Dispute resolved', resolution });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/vendors ────────────────────────────────────────────────────
// tab: 'all' | 'applications' (pending) | 'suspended'

async function getVendors(req, res, next) {
  try {
    const { tab = 'all', search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const conditions = [];

    if (tab === 'applications') {
      conditions.push(`vp.status = 'pending'`);
    } else if (tab === 'suspended') {
      conditions.push(`vp.status = 'suspended'`);
    } else {
      conditions.push(`vp.status != 'pending'`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(vp.business_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
      );
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM vendor_profiles vp JOIN users u ON u.id = vp.user_id ${where}`,
      params
    );
    const total = Number(countResult.rows[0].total);

    params.push(Number(limit), offset);
    const rows = await db.query(
      `SELECT vp.id, vp.user_id, vp.business_name, vp.business_email, vp.business_phone,
              vp.status, vp.total_sales, vp.created_at,
              vp.business_description,
              u.email, u.status AS user_status,
              COUNT(DISTINCT p.id) AS product_count,
              ROW_NUMBER() OVER (ORDER BY vp.created_at) AS row_num
       FROM vendor_profiles vp
       JOIN users u ON u.id = vp.user_id
       LEFT JOIN products p ON p.vendor_id = vp.id AND p.status != 'deleted'
       ${where}
       GROUP BY vp.id, u.email, u.status
       ORDER BY vp.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Assign vendor IDs based on global row numbers
    const vendorCountResult = await db.query(
      `SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS row_num FROM vendor_profiles ORDER BY created_at`
    );
    const rowNumMap = {};
    vendorCountResult.rows.forEach((r) => { rowNumMap[r.id] = r.row_num; });

    const vendors = rows.rows.map((v) => {
      let info = {};
      try { info = typeof v.business_description === 'string' ? JSON.parse(v.business_description) : (v.business_description || {}); } catch {}
      return {
        ...v,
        vendor_id_display: fmtVendorId(rowNumMap[v.id] || v.row_num),
        first_name: info.first_name || '',
        last_name:  info.last_name  || '',
        city:       info.city       || '',
        country:    info.country    || '',
        category_name: v.category_name || null,
      };
    });

    res.json({
      vendors,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/vendors/:id ────────────────────────────────────────────────

async function getVendor(req, res, next) {
  try {
    const { id } = req.params;

    const vendorResult = await db.query(
      `SELECT vp.*, u.email, u.status AS user_status, u.created_at AS user_created_at,
              vw.available_balance, vw.on_hold_balance, vw.total_earned, vw.total_withdrawn,
              ROW_NUMBER() OVER (ORDER BY vp.created_at) AS row_num
       FROM vendor_profiles vp
       JOIN users u ON u.id = vp.user_id
       LEFT JOIN vendor_wallets vw ON vw.vendor_id = vp.id
       WHERE vp.id = $1`,
      [id]
    );
    if (!vendorResult.rows.length) return res.status(404).json({ message: 'Vendor not found' });

    const v = vendorResult.rows[0];
    let info = {};
    try { info = typeof v.business_description === 'string' ? JSON.parse(v.business_description) : (v.business_description || {}); } catch {}

    // Global row number for vendor ID
    const rnResult = await db.query(
      `SELECT ROW_NUMBER() OVER (ORDER BY created_at) AS row_num FROM vendor_profiles WHERE id = $1`,
      [id]
    );

    const vendor = {
      ...v,
      vendor_id_display: fmtVendorId(rnResult.rows[0]?.row_num || v.row_num),
      first_name: info.first_name || '',
      last_name:  info.last_name  || '',
      address:    info.address    || '',
      city:       info.city       || '',
      state:      info.state      || '',
      country:    info.country    || '',
      registration_number: info.registration_number || '',
    };

    // Products
    const productsResult = await db.query(
      `SELECT p.id, p.name, p.price, p.total_sold, p.status, p.created_at,
              c.name AS category_name,
              p.short_description,
              (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.vendor_id = $1 AND p.status != 'deleted'
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [id]
    );

    // Payout total
    const payoutResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid_out
       FROM payout_requests WHERE vendor_id = $1 AND status = 'completed'`,
      [id]
    );

    res.json({
      vendor,
      products:      productsResult.rows,
      total_paid_out: Number(payoutResult.rows[0].total_paid_out),
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/vendors/:id/status ──────────────────────────────────────
// action: 'activate' | 'suspend' | 'deactivate'

async function updateVendorStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['activate', 'suspend', 'deactivate'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const vendorRes = await db.query(`SELECT user_id FROM vendor_profiles WHERE id = $1`, [id]);
    if (!vendorRes.rows.length) return res.status(404).json({ message: 'Vendor not found' });
    const userId = vendorRes.rows[0].user_id;

    await db.withTransaction(async (client) => {
      if (action === 'activate') {
        await client.query(`UPDATE vendor_profiles SET status = 'active', updated_at = NOW() WHERE id = $1`, [id]);
        await client.query(`UPDATE users SET status = 'active', updated_at = NOW() WHERE id = $1`, [userId]);
      } else if (action === 'suspend') {
        await client.query(`UPDATE vendor_profiles SET status = 'suspended', updated_at = NOW() WHERE id = $1`, [id]);
      } else {
        // deactivate — locks out the user account entirely
        await client.query(`UPDATE vendor_profiles SET status = 'rejected', updated_at = NOW() WHERE id = $1`, [id]);
        await client.query(`UPDATE users SET status = 'deactivated', updated_at = NOW() WHERE id = $1`, [userId]);
      }
    });

    res.json({ message: `Vendor ${action}d successfully` });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/vendors/applications ──────────────────────────────────────

async function getApplications(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM vendor_profiles WHERE status = 'pending'`
    );
    const total = Number(countResult.rows[0].total);

    const rows = await db.query(
      `SELECT vp.id, vp.business_name, vp.business_phone, vp.business_email,
              vp.business_description, vp.status, vp.created_at,
              u.email
       FROM vendor_profiles vp
       JOIN users u ON u.id = vp.user_id
       WHERE vp.status = 'pending'
       ORDER BY vp.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );

    const applications = rows.rows.map((v) => {
      let info = {};
      try { info = typeof v.business_description === 'string' ? JSON.parse(v.business_description) : (v.business_description || {}); } catch {}
      return { ...v, first_name: info.first_name || '', last_name: info.last_name || '', city: info.city || '', country: info.country || '', address: info.address || '', registration_number: info.registration_number || '' };
    });

    res.json({
      applications,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/vendors/applications/:id ───────────────────────────────────

async function getApplication(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT vp.*, u.email, u.phone
       FROM vendor_profiles vp
       JOIN users u ON u.id = vp.user_id
       WHERE vp.id = $1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Application not found' });

    const v = result.rows[0];
    let info = {};
    try { info = typeof v.business_description === 'string' ? JSON.parse(v.business_description) : (v.business_description || {}); } catch {}

    res.json({
      application: {
        ...v,
        first_name: info.first_name || '',
        last_name:  info.last_name  || '',
        address:    info.address    || '',
        city:       info.city       || '',
        state:      info.state      || '',
        country:    info.country    || '',
        registration_number: info.registration_number || '',
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/vendors/:id/approve ──────────────────────────────────────

async function approveVendor(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE vendor_profiles SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING business_name, user_id`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Pending application not found' });

    const { business_name, user_id } = result.rows[0];

    // Activate user account
    await db.query(
      `UPDATE users SET status = 'active', updated_at = NOW() WHERE id = $1`,
      [user_id]
    );

    // Send approval email (non-blocking)
    db.query(`SELECT email FROM users WHERE id = $1`, [user_id])
      .then(({ rows }) => {
        if (rows[0]?.email) {
          sendVendorApprovedEmail({ email: rows[0].email, business_name }).catch(() => {});
        }
      });

    res.json({ message: `${business_name} approved successfully` });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/vendors/:id/reject ───────────────────────────────────────

async function rejectVendor(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await db.query(
      `UPDATE vendor_profiles SET status = 'rejected', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING business_name, user_id`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Pending application not found' });

    const { business_name, user_id } = result.rows[0];

    // Send rejection email (non-blocking)
    db.query(`SELECT email FROM users WHERE id = $1`, [user_id])
      .then(({ rows }) => {
        if (rows[0]?.email) {
          sendVendorRejectedEmail({ email: rows[0].email, business_name, reason }).catch(() => {});
        }
      });

    res.json({ message: `Application rejected` });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/products ───────────────────────────────────────────────────

async function getAdminProducts(req, res, next) {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const conditions = [`p.status != 'deleted'`];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR vp.business_name ILIKE $${params.length})`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM products p JOIN vendor_profiles vp ON vp.id = p.vendor_id ${where}`,
      params
    );
    const total = Number(countResult.rows[0].total);

    params.push(Number(limit), offset);
    const rows = await db.query(
      `SELECT p.id, p.name, p.price, p.total_sold, p.status, p.stock_quantity,
              p.rating, p.review_count, p.created_at,
              c.name AS category_name,
              vp.id AS vendor_profile_id, vp.business_name AS vendor_name,
              (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image
       FROM products p
       JOIN vendor_profiles vp ON vp.id = p.vendor_id
       JOIN categories c ON c.id = p.category_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      products: rows.rows,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/products/:id ───────────────────────────────────────────────

async function getAdminProduct(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT p.*, c.name AS category_name, c.commission_rate,
              vp.id AS vendor_profile_id, vp.business_name AS vendor_name,
              u.email AS vendor_email
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN vendor_profiles vp ON vp.id = p.vendor_id
       JOIN users u ON u.id = vp.user_id
       WHERE p.id = $1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Product not found' });

    const imagesResult = await db.query(
      `SELECT id, url, alt_text, is_primary, sort_order
       FROM product_images WHERE product_id = $1 ORDER BY sort_order`,
      [id]
    );

    res.json({ product: result.rows[0], images: imagesResult.rows });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/products/:id/status ─────────────────────────────────────

async function updateProductStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['active', 'suspended', 'draft'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    await db.query(
      `UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );
    res.json({ message: 'Product status updated' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/categories ─────────────────────────────────────────────────

async function getCategories(req, res, next) {
  try {
    // Stats
    const statsResult = await db.query(
      `SELECT COUNT(*) AS total_categories,
              COUNT(CASE WHEN active = true THEN 1 END) AS active_categories,
              COALESCE(AVG(commission_rate), 0) AS avg_commission
       FROM categories WHERE parent_id IS NULL`
    );
    const totalProductsResult = await db.query(
      `SELECT COUNT(*) AS total_products FROM products WHERE status != 'deleted'`
    );

    // Category list with product count and revenue
    const rows = await db.query(
      `SELECT c.id, c.name, c.slug, c.commission_rate, c.active, c.sort_order, c.created_at,
              COUNT(DISTINCT p.id) AS product_count,
              COALESCE(SUM(p.total_sold * p.price), 0) AS estimated_revenue
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.status != 'deleted'
       WHERE c.parent_id IS NULL
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`
    );

    res.json({
      stats: {
        total_categories:  Number(statsResult.rows[0].total_categories),
        active_categories: Number(statsResult.rows[0].active_categories),
        total_products:    Number(totalProductsResult.rows[0].total_products),
        avg_commission:    Number(statsResult.rows[0].avg_commission).toFixed(1),
      },
      categories: rows.rows,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/categories ────────────────────────────────────────────────

async function createCategory(req, res, next) {
  try {
    const { name, commission_rate, description } = req.body;
    if (!name || commission_rate === undefined) {
      return res.status(400).json({ message: 'Name and commission rate are required' });
    }

    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await db.query(`SELECT id FROM categories WHERE slug = $1`, [slug]);
    if (existing.rows.length) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const result = await db.query(
      `INSERT INTO categories (name, slug, commission_rate, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), slug, Number(commission_rate), description || null]
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/admin/categories/:id ─────────────────────────────────────────────

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, commission_rate, description } = req.body;

    const sets   = [];
    const params = [];

    if (name !== undefined) {
      params.push(name.trim());
      sets.push(`name = $${params.length}`);
      const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      params.push(slug);
      sets.push(`slug = $${params.length}`);
    }
    if (commission_rate !== undefined) {
      params.push(Number(commission_rate));
      sets.push(`commission_rate = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      sets.push(`description = $${params.length}`);
    }

    if (!sets.length) return res.status(400).json({ message: 'Nothing to update' });

    sets.push('updated_at = NOW()');
    params.push(id);

    const result = await db.query(
      `UPDATE categories SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Category not found' });
    res.json({ category: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/categories/:id/status ────────────────────────────────────

async function toggleCategoryStatus(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE categories SET active = NOT active, updated_at = NOW()
       WHERE id = $1 RETURNING id, name, active`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Category not found' });
    const cat = result.rows[0];
    res.json({ message: `Category ${cat.active ? 'activated' : 'deactivated'}`, category: cat });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/payouts ────────────────────────────────────────────────────

async function getPayouts(req, res, next) {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Stats: Total Pending, Released Today (processing set today), Total Released (all completed)
    const statsResult = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)    AS total_pending_amount,
         COUNT(CASE WHEN status = 'pending' THEN 1 END)                            AS total_pending_count,
         COALESCE(SUM(CASE WHEN status = 'processing'
                           AND processed_at >= CURRENT_DATE THEN amount ELSE 0 END), 0) AS released_today_amount,
         COUNT(CASE WHEN status = 'processing'
                    AND processed_at >= CURRENT_DATE THEN 1 END)                   AS released_today_count,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0)  AS total_released_amount,
         COUNT(CASE WHEN status = 'completed' THEN 1 END)                          AS total_released_count
       FROM payout_requests`
    );

    // Determine status filter
    const statusFilter = ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)
      ? status : 'pending';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM payout_requests WHERE status = $1`,
      [statusFilter]
    );
    const total = Number(countResult.rows[0].total);

    const rows = await db.query(
      `SELECT pr.id, pr.vendor_id, pr.amount, pr.bank_name, pr.bank_account_number,
              pr.bank_account_name, pr.bank_code, pr.status, pr.gateway_reference,
              pr.processed_at, pr.failure_reason, pr.notes, pr.created_at,
              vp.business_name AS vendor_name,
              u.email AS vendor_email
       FROM payout_requests pr
       JOIN vendor_profiles vp ON vp.id = pr.vendor_id
       JOIN users u ON u.id = vp.user_id
       WHERE pr.status = $1
       ORDER BY pr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [statusFilter, Number(limit), offset]
    );

    res.json({
      payouts: rows.rows,
      stats:   statsResult.rows[0],
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/payouts/:id ────────────────────────────────────────────────

async function getPayout(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT pr.*,
              vp.business_name AS vendor_name, vp.id AS vendor_profile_id,
              u.email AS vendor_email,
              vw.available_balance, vw.on_hold_balance,
              ROW_NUMBER() OVER (ORDER BY pr.created_at) AS row_num,
              (SELECT ROW_NUMBER() OVER (ORDER BY created_at)
               FROM vendor_profiles WHERE id = pr.vendor_id LIMIT 1) AS vendor_row_num
       FROM payout_requests pr
       JOIN vendor_profiles vp ON vp.id = pr.vendor_id
       JOIN users u ON u.id = vp.user_id
       LEFT JOIN vendor_wallets vw ON vw.vendor_id = pr.vendor_id
       WHERE pr.id = $1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Payout not found' });

    const p = result.rows[0];
    const payout = {
      ...p,
      receipt_number:    `PAY-${String(p.row_num).padStart(3, '0')}`,
      vendor_id_display: fmtVendorId(p.vendor_row_num),
      account_number:    p.bank_account_number,
      account_name:      p.bank_account_name,
    };
    res.json({ payout });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/payouts/:id/release ──────────────────────────────────────
// Moves payout from 'pending' → 'processing', deducts available balance

async function releasePayout(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    await db.withTransaction(async (client) => {
      const prRes = await client.query(
        `SELECT pr.*, vw.id AS wallet_id, vw.available_balance, vw.on_hold_balance
         FROM payout_requests pr
         JOIN vendor_wallets vw ON vw.vendor_id = pr.vendor_id
         WHERE pr.id = $1 AND pr.status = 'pending'`,
        [id]
      );
      if (!prRes.rows.length) {
        const e = new Error('Payout not found or not in pending state'); e.status = 404; throw e;
      }
      const pr = prRes.rows[0];

      if (Number(pr.available_balance) < Number(pr.amount)) {
        const e = new Error('Vendor does not have sufficient available balance'); e.status = 400; throw e;
      }

      // Move to processing
      await client.query(
        `UPDATE payout_requests
         SET status = 'processing', processed_by = $1, processed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [adminId, id]
      );

      // Deduct from available balance
      const wRes = await client.query(
        `UPDATE vendor_wallets
         SET available_balance = available_balance - $1,
             total_withdrawn   = total_withdrawn   + $1,
             updated_at        = NOW()
         WHERE id = $2
         RETURNING available_balance, on_hold_balance`,
        [pr.amount, pr.wallet_id]
      );
      const w = wRes.rows[0];

      // Wallet transaction log
      await client.query(
        `INSERT INTO wallet_transactions
           (wallet_id, type, amount,
            available_before, available_after,
            on_hold_before, on_hold_after,
            description, reference)
         VALUES ($1, 'payout', $2, $3, $4, $5, $5, $6, $7)`,
        [
          pr.wallet_id, pr.amount,
          Number(w.available_balance) + Number(pr.amount),  // before
          w.available_balance,                               // after
          w.on_hold_balance,
          `Payout released by admin`,
          `PAYOUT_${id}`,
        ]
      );
    });

    // Send payout-in-progress email (non-blocking)
    db.query(
      `SELECT u.email, vp.business_name, pr.amount, pr.bank_name, pr.bank_account_number
       FROM payout_requests pr
       JOIN vendor_profiles vp ON vp.id = pr.vendor_id
       JOIN users u ON u.id = vp.user_id
       WHERE pr.id = $1`,
      [id]
    ).then(({ rows }) => {
      if (rows[0]) {
        sendPayoutProcessingEmail({
          email:          rows[0].email,
          business_name:  rows[0].business_name,
          amount:         rows[0].amount,
          bank_name:      rows[0].bank_name,
          account_number: rows[0].bank_account_number,
        }).catch(() => {});
      }
    });

    res.json({ message: 'Payout released to processing' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/payouts/:id/complete ─────────────────────────────────────
// Marks processing payout as completed (real: triggered by Paystack webhook)

async function completePayout(req, res, next) {
  try {
    const { id } = req.params;
    const { gateway_reference } = req.body;
    const adminId = req.user.id;

    const result = await db.query(
      `UPDATE payout_requests
       SET status = 'completed', gateway_reference = COALESCE($1, gateway_reference),
           processed_by = $2, processed_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND status = 'processing'
       RETURNING *`,
      [gateway_reference || null, adminId, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Payout not found or not processing' });

    // Send payout-completed email (non-blocking)
    const pr = result.rows[0];
    db.query(
      `SELECT u.email, vp.business_name FROM vendor_profiles vp JOIN users u ON u.id = vp.user_id WHERE vp.id = $1`,
      [pr.vendor_id]
    ).then(({ rows }) => {
      if (rows[0]) {
        sendPayoutCompletedEmail({
          email:          rows[0].email,
          business_name:  rows[0].business_name,
          amount:         pr.amount,
          bank_name:      pr.bank_name,
          account_number: pr.bank_account_number,
        }).catch(() => {});
      }
    });

    res.json({ message: 'Payout marked as completed' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reports/sales ─────────────────────────────────────────────

async function getSalesAnalytics(req, res, next) {
  try {
    const { period = 'this_month' } = req.query;
    let interval;
    if (period === 'today')        interval = '1 day';
    else if (period === 'week')    interval = '7 days';
    else if (period === '3months') interval = '3 months';
    else                           interval = '1 month';

    // Stats
    const stats = await db.query(
      `SELECT COALESCE(SUM(o.total_ngn), 0)           AS total_revenue,
              COALESCE(SUM(vo.commission_ngn), 0)       AS total_commission,
              COUNT(DISTINCT o.id)                       AS total_orders,
              COALESCE(AVG(o.total_ngn), 0)              AS avg_order_value
       FROM orders o
       JOIN vendor_orders vo ON vo.order_id = o.id
       WHERE o.status = 'paid'
         AND o.created_at >= NOW() - $1::INTERVAL`,
      [interval]
    );

    // Monthly revenue (last 12 months)
    const monthlyRevenue = await db.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', o.created_at), 'Mon') AS month,
              EXTRACT(MONTH FROM o.created_at) AS month_num,
              EXTRACT(YEAR  FROM o.created_at) AS year,
              COALESCE(SUM(o.total_ngn), 0) AS revenue
       FROM orders o
       WHERE o.status = 'paid'
         AND o.created_at >= NOW() - INTERVAL '12 months'
       GROUP BY month, month_num, year
       ORDER BY year, month_num`
    );

    // Orders by category
    const byCategory = await db.query(
      `SELECT c.name, COUNT(oi.id) AS order_count
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       JOIN vendor_orders vo ON vo.id = oi.vendor_order_id
       JOIN orders o ON o.id = vo.order_id
       WHERE o.status = 'paid'
       GROUP BY c.name
       ORDER BY order_count DESC
       LIMIT 6`
    );

    // Top vendors by revenue
    const topVendors = await db.query(
      `SELECT vp.business_name AS vendor_name, COALESCE(SUM(vo.total_ngn), 0) AS revenue
       FROM vendor_orders vo
       JOIN vendor_profiles vp ON vp.id = vo.vendor_id
       JOIN orders o ON o.id = vo.order_id
       WHERE o.status = 'paid'
       GROUP BY vp.id, vp.business_name
       ORDER BY revenue DESC
       LIMIT 5`
    );

    // Sales by month (units/orders)
    const salesByMonth = await db.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', o.created_at), 'Mon') AS month,
              EXTRACT(MONTH FROM o.created_at) AS month_num,
              EXTRACT(YEAR  FROM o.created_at) AS year,
              COUNT(DISTINCT o.id) AS order_count
       FROM orders o
       WHERE o.status = 'paid'
         AND o.created_at >= NOW() - INTERVAL '12 months'
       GROUP BY month, month_num, year
       ORDER BY year, month_num`
    );

    // Top selling products
    const topProducts = await db.query(
      `SELECT p.name AS product_name, vp.business_name AS vendor_name,
              c.name AS category, COALESCE(SUM(oi.quantity), 0) AS units_sold,
              COALESCE(SUM(oi.quantity * oi.unit_price_ngn), 0) AS revenue,
              COALESCE(SUM(vo.commission_ngn), 0) AS commission
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN vendor_orders vo ON vo.id = oi.vendor_order_id
       JOIN orders o ON o.id = vo.order_id
       JOIN vendor_profiles vp ON vp.id = vo.vendor_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE o.status = 'paid'
       GROUP BY p.id, p.name, vp.business_name, c.name
       ORDER BY units_sold DESC
       LIMIT 10`
    );

    res.json({
      stats: stats.rows[0],
      monthly_revenue: monthlyRevenue.rows,
      by_category:     byCategory.rows,
      top_vendors:     topVendors.rows,
      sales_by_month:  salesByMonth.rows,
      top_products:    topProducts.rows,
    });
  } catch (err) { next(err); }
}

// ── GET /api/admin/reports/vendors ────────────────────────────────────────────

async function getVendorPerformance(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const like   = `%${search}%`;

    const countRes = await db.query(
      `SELECT COUNT(*) AS total FROM vendor_profiles vp
       WHERE ($1 = '' OR vp.business_name ILIKE $1)`,
      [search ? like : '']
    );
    const total = Number(countRes.rows[0].total);

    const rows = await db.query(
      `SELECT vp.id, vp.business_name, vp.status, u.email,
              COUNT(DISTINCT p.id)                               AS product_count,
              COUNT(DISTINCT vo.id) FILTER (WHERE vo.id IS NOT NULL) AS order_count,
              COALESCE(SUM(vo.total_ngn), 0)                    AS revenue,
              COALESCE(SUM(vo.commission_ngn), 0)               AS commission,
              COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)     AS avg_rating,
              (SELECT c.name FROM products pr
               JOIN categories c ON c.id = pr.category_id
               WHERE pr.vendor_id = vp.id
               GROUP BY c.name ORDER BY COUNT(*) DESC LIMIT 1)  AS category
       FROM vendor_profiles vp
       JOIN users u ON u.id = vp.user_id
       LEFT JOIN products p ON p.vendor_id = vp.id AND p.status != 'deleted'
       LEFT JOIN vendor_orders vo ON vo.vendor_id = vp.id
       LEFT JOIN reviews r ON r.product_id = p.id
       WHERE ($1 = '' OR vp.business_name ILIKE $1)
       GROUP BY vp.id, vp.business_name, vp.status, u.email
       ORDER BY revenue DESC
       LIMIT $2 OFFSET $3`,
      [search ? like : '', Number(limit), offset]
    );

    const summary = await db.query(
      `SELECT COUNT(*)                                       AS total_vendors,
              COUNT(*) FILTER (WHERE status = 'active')     AS active_vendors,
              COALESCE(SUM(vo.total_ngn), 0)                AS total_revenue,
              COALESCE(SUM(vo.commission_ngn), 0)           AS total_commission
       FROM vendor_profiles vp
       LEFT JOIN vendor_orders vo ON vo.vendor_id = vp.id`
    );

    res.json({
      vendors: rows.rows,
      total,
      summary: summary.rows[0],
    });
  } catch (err) { next(err); }
}

// ── GET /api/admin/reports/transactions ───────────────────────────────────────

async function getTransactions(req, res, next) {
  try {
    const { type = 'sales', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Map tab → wallet_tx_type
    const typeMap = {
      sales:      "'escrow_credit'",
      payouts:    "'payout'",
      refunds:    "'escrow_refund'",
      commission: "'commission_debit'",
    };
    const typeFilter = typeMap[type] || "'escrow_credit'";

    const countRes = await db.query(
      `SELECT COUNT(*) AS total FROM wallet_transactions WHERE type = ${typeFilter}`
    );
    const total = Number(countRes.rows[0].total);

    const rows = await db.query(
      `SELECT wt.id, wt.type, wt.amount, wt.created_at, wt.description,
              vp.business_name AS vendor_name,
              o.order_number,
              u_cust.email AS customer_email,
              cp.first_name AS customer_first, cp.last_name AS customer_last,
              ROW_NUMBER() OVER (ORDER BY wt.created_at DESC) AS row_num
       FROM wallet_transactions wt
       JOIN vendor_wallets vw ON vw.id = wt.wallet_id
       JOIN vendor_profiles vp ON vp.id = vw.vendor_id
       LEFT JOIN vendor_orders vo ON vo.id = wt.vendor_order_id
       LEFT JOIN orders o ON o.id = vo.order_id
       LEFT JOIN users u_cust ON u_cust.id = o.customer_id
       LEFT JOIN customer_profiles cp ON cp.user_id = u_cust.id
       WHERE wt.type = ${typeFilter}
       ORDER BY wt.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );

    const transactions = rows.rows.map((t) => ({
      ...t,
      txn_number: `TXN-${String(t.row_num).padStart(3, '0')}`,
      customer_name: [t.customer_first, t.customer_last].filter(Boolean).join(' ') || t.customer_email || '—',
    }));

    res.json({
      transactions,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
}

// ── GET /api/admin/profile ────────────────────────────────────────────────────

async function getAdminProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT u.id, u.email, u.role, ap.first_name, ap.last_name, ap.permissions
       FROM users u
       LEFT JOIN admin_profiles ap ON ap.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Profile not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

// ── PATCH /api/admin/profile ──────────────────────────────────────────────────

async function updateAdminProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone } = req.body;
    await db.query(
      `UPDATE admin_profiles SET
         first_name = COALESCE($1, first_name),
         last_name  = COALESCE($2, last_name),
         updated_at = NOW()
       WHERE user_id = $3`,
      [first_name || null, last_name || null, userId]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) { next(err); }
}

// ── GET /api/admin/customers ─────────────────────────────────────────────────

async function getCustomers(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const like   = `%${search}%`;

    const where = search
      ? `AND (u.email ILIKE $4 OR cp.first_name ILIKE $4 OR cp.last_name ILIKE $4
             OR CONCAT(cp.first_name,' ',cp.last_name) ILIKE $4)`
      : '';
    const statusWhere = status ? `AND u.status = '${status}'` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE u.role = 'customer' ${statusWhere} ${where}`,
      search ? [null, null, null, like] : []
    );

    const rows = await db.query(
      `SELECT u.id, u.email, u.status, u.created_at,
              cp.first_name, cp.last_name, cp.phone,
              COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS order_count,
              COALESCE(SUM(o.total_ngn) FILTER (WHERE o.status = 'paid'), 0) AS total_spent
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       LEFT JOIN orders o ON o.customer_id = u.id
       WHERE u.role = 'customer' ${statusWhere} ${where}
       GROUP BY u.id, cp.first_name, cp.last_name, cp.phone
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2 ${search ? '' : ''}`,
      search ? [Number(limit), offset, null, like] : [Number(limit), offset]
    );

    const summary = await db.query(
      `SELECT COUNT(*)                                                  AS total_customers,
              COUNT(*) FILTER (WHERE u.status = 'active')              AS active_customers,
              COUNT(*) FILTER (WHERE u.status IN ('suspended','deactivated')) AS suspended_customers,
              COALESCE(SUM(o.total_ngn) FILTER (WHERE o.status = 'paid'), 0) AS total_revenue
       FROM users u
       LEFT JOIN orders o ON o.customer_id = u.id
       WHERE u.role = 'customer'`
    );

    res.json({
      customers: rows.rows,
      total: Number(countResult.rows[0].total),
      summary: summary.rows[0],
    });
  } catch (err) { next(err); }
}

// ── GET /api/admin/customers/:id ──────────────────────────────────────────────

async function getCustomer(req, res, next) {
  try {
    const { id } = req.params;

    const cust = await db.query(
      `SELECT u.id, u.email, u.status, u.created_at,
              cp.first_name, cp.last_name, cp.phone,
              cp.address, cp.city, cp.state, cp.country
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE u.id = $1 AND u.role = 'customer'`,
      [id]
    );
    if (!cust.rows.length) return res.status(404).json({ error: 'Customer not found' });

    const stats = await db.query(
      `SELECT COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid')               AS total_orders,
              COALESCE(SUM(o.total_ngn) FILTER (WHERE o.status = 'paid'), 0)       AS total_spent,
              COALESCE(AVG(o.total_ngn) FILTER (WHERE o.status = 'paid'), 0)       AS avg_order_value,
              COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending')             AS pending_orders
       FROM orders o WHERE o.customer_id = $1`,
      [id]
    );

    const orders = await db.query(
      `SELECT o.id, o.order_number, o.status, o.total_ngn, o.created_at,
              COUNT(oi.id) AS item_count,
              ROW_NUMBER() OVER (ORDER BY o.created_at DESC) AS row_num
       FROM orders o
       LEFT JOIN vendor_orders vo ON vo.order_id = o.id
       LEFT JOIN order_items oi ON oi.vendor_order_id = vo.id
       WHERE o.customer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 20`,
      [id]
    );

    const customer = {
      ...cust.rows[0],
      full_name: [cust.rows[0].first_name, cust.rows[0].last_name].filter(Boolean).join(' ') || cust.rows[0].email,
    };

    res.json({ customer, stats: stats.rows[0], orders: orders.rows });
  } catch (err) { next(err); }
}

// ── PATCH /api/admin/customers/:id/status ────────────────────────────────────

async function updateCustomerStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'suspend' | 'activate'
    if (!['suspend', 'activate'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

    const newStatus = action === 'activate' ? 'active' : 'suspended';
    const result = await db.query(
      `UPDATE users SET status = $1, updated_at = NOW()
       WHERE id = $2 AND role = 'customer' RETURNING id`,
      [newStatus, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: `Customer ${action}d` });
  } catch (err) { next(err); }
}

// ── GET /api/admin/notifications ─────────────────────────────────────────────
// Derived from pending/open items across multiple tables — no dedicated table needed.

async function getNotifications(req, res, next) {
  try {
    const [applications, disputes, payouts, orders] = await Promise.all([
      db.query(
        `SELECT vp.id, vp.business_name, vp.created_at
         FROM vendor_profiles vp WHERE vp.status = 'pending'
         ORDER BY vp.created_at DESC LIMIT 10`
      ),
      db.query(
        `SELECT d.id, d.reason, d.status, d.created_at,
                u.email AS raised_by_email,
                cp.first_name, cp.last_name
         FROM disputes d
         JOIN users u ON u.id = d.raised_by
         LEFT JOIN customer_profiles cp ON cp.user_id = u.id
         WHERE d.status IN ('open','under_review')
         ORDER BY d.created_at DESC LIMIT 10`
      ),
      db.query(
        `SELECT pr.id, pr.amount, pr.status, pr.created_at,
                vp.business_name
         FROM payout_requests pr
         JOIN vendor_profiles vp ON vp.id = pr.vendor_id
         WHERE pr.status = 'pending'
         ORDER BY pr.created_at DESC LIMIT 10`
      ),
      db.query(
        `SELECT o.id, o.order_number, o.total_ngn, o.created_at,
                cp.first_name, cp.last_name, u.email
         FROM orders o
         JOIN users u ON u.id = o.customer_id
         LEFT JOIN customer_profiles cp ON cp.user_id = u.id
         WHERE o.created_at >= NOW() - INTERVAL '24 hours'
         ORDER BY o.created_at DESC LIMIT 10`
      ),
    ]);

    const notifications = [
      ...applications.rows.map((r) => ({
        id:       `app-${r.id}`,
        type:     'vendor_application',
        priority: 'warning',
        title:    `New vendor application`,
        body:     `${r.business_name} has applied to join Bryge`,
        link:     `/admin/vendors/applications/${r.id}`,
        created_at: r.created_at,
      })),
      ...disputes.rows.map((r) => ({
        id:       `dis-${r.id}`,
        type:     'dispute',
        priority: r.status === 'open' ? 'danger' : 'warning',
        title:    `${r.status === 'open' ? 'New' : 'Open'} dispute`,
        body:     `${[r.first_name, r.last_name].filter(Boolean).join(' ') || r.raised_by_email}: ${r.reason}`,
        link:     `/admin/disputes/${r.id}`,
        created_at: r.created_at,
      })),
      ...payouts.rows.map((r) => ({
        id:       `pay-${r.id}`,
        type:     'payout',
        priority: 'info',
        title:    `Pending payout request`,
        body:     `${r.business_name} — ₦${Number(r.amount).toLocaleString('en-NG')}`,
        link:     `/admin/payouts/${r.id}`,
        created_at: r.created_at,
      })),
      ...orders.rows.map((r) => ({
        id:       `ord-${r.id}`,
        type:     'order',
        priority: 'success',
        title:    `New order ${r.order_number}`,
        body:     `${[r.first_name, r.last_name].filter(Boolean).join(' ') || r.email} — ₦${Number(r.total_ngn).toLocaleString('en-NG')}`,
        link:     `/admin/orders/${r.id}`,
        created_at: r.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const counts = {
      total:        notifications.length,
      applications: applications.rows.length,
      disputes:     disputes.rows.length,
      payouts:      payouts.rows.length,
      orders:       orders.rows.length,
    };

    res.json({ notifications, counts });
  } catch (err) { next(err); }
}

// ── GET /api/admin/refunds ────────────────────────────────────────────────────

async function getRefunds(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const like   = `%${search}%`;

    const countRes = await db.query(
      `SELECT COUNT(*) AS total FROM wallet_transactions WHERE type = 'escrow_refund'`
    );
    const total = Number(countRes.rows[0].total);

    const rows = await db.query(
      `SELECT wt.id, wt.amount, wt.created_at, wt.description, wt.reference,
              ROW_NUMBER() OVER (ORDER BY wt.created_at DESC) AS row_num,
              vp.business_name AS vendor_name,
              u_cust.email     AS customer_email,
              cp.first_name    AS customer_first,
              cp.last_name     AS customer_last,
              o.order_number,
              d.id             AS dispute_id,
              d.reason         AS dispute_reason
       FROM wallet_transactions wt
       JOIN vendor_wallets vw ON vw.id = wt.wallet_id
       JOIN vendor_profiles vp ON vp.id = vw.vendor_id
       LEFT JOIN disputes d ON wt.reference = CONCAT('DISPUTE_REFUND_', d.id::text)
       LEFT JOIN users u_cust ON u_cust.id = d.raised_by
       LEFT JOIN customer_profiles cp ON cp.user_id = u_cust.id
       LEFT JOIN vendor_orders vo ON vo.id = wt.vendor_order_id
       LEFT JOIN orders o ON o.id = vo.order_id
       WHERE wt.type = 'escrow_refund'
         AND ($3 = '' OR vp.business_name ILIKE $3 OR u_cust.email ILIKE $3
              OR o.order_number ILIKE $3)
       ORDER BY wt.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset, search ? like : '']
    );

    const summary = await db.query(
      `SELECT COUNT(*)                   AS total_refunds,
              COALESCE(SUM(amount), 0)   AS total_amount
       FROM wallet_transactions WHERE type = 'escrow_refund'`
    );

    const refunds = rows.rows.map((r) => ({
      ...r,
      refund_number: `REF-${String(r.row_num).padStart(3, '0')}`,
      customer_name: [r.customer_first, r.customer_last].filter(Boolean).join(' ') || r.customer_email || '—',
    }));

    res.json({ refunds, total, summary: summary.rows[0] });
  } catch (err) { next(err); }
}

// ── GET /api/admin/audit-log ──────────────────────────────────────────────────
// Derived from dispute resolutions and payout actions — no dedicated table needed.

async function getAuditLog(req, res, next) {
  try {
    const { page = 1, limit = 20, admin_id, action_type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [resolutions, releases, completions] = await Promise.all([
      db.query(
        `SELECT 'Dispute resolved'                                          AS action,
                CONCAT(ap.first_name,' ',ap.last_name)                     AS admin_name,
                u.email                                                     AS admin_email,
                CONCAT('Dispute — ', d.reason, ' (', d.status, ')')        AS details,
                d.id                                                        AS ref_id,
                'dispute'                                                   AS ref_type,
                d.resolved_at                                               AS occurred_at
         FROM disputes d
         JOIN users u ON u.id = d.resolved_by
         LEFT JOIN admin_profiles ap ON ap.user_id = u.id
         WHERE d.resolved_by IS NOT NULL
           AND ($1::text IS NULL OR d.resolved_by::text = $1)`,
        [admin_id || null]
      ),
      db.query(
        `SELECT 'Payout released'                                              AS action,
                CONCAT(ap.first_name,' ',ap.last_name)                        AS admin_name,
                u.email                                                        AS admin_email,
                CONCAT(vp.business_name,' — ₦', pr.amount)                   AS details,
                pr.id                                                          AS ref_id,
                'payout'                                                       AS ref_type,
                pr.released_at                                                 AS occurred_at
         FROM payout_requests pr
         JOIN vendor_profiles vp ON vp.id = pr.vendor_id
         JOIN users u ON u.id = pr.released_by
         LEFT JOIN admin_profiles ap ON ap.user_id = u.id
         WHERE pr.released_by IS NOT NULL
           AND ($1::text IS NULL OR pr.released_by::text = $1)`,
        [admin_id || null]
      ),
      db.query(
        `SELECT 'Payout completed'                                             AS action,
                CONCAT(ap.first_name,' ',ap.last_name)                        AS admin_name,
                u.email                                                        AS admin_email,
                CONCAT(vp.business_name,' — ₦', pr.amount)                   AS details,
                pr.id                                                          AS ref_id,
                'payout'                                                       AS ref_type,
                pr.processed_at                                                AS occurred_at
         FROM payout_requests pr
         JOIN vendor_profiles vp ON vp.id = pr.vendor_id
         JOIN users u ON u.id = pr.processed_by
         LEFT JOIN admin_profiles ap ON ap.user_id = u.id
         WHERE pr.processed_by IS NOT NULL
           AND ($1::text IS NULL OR pr.processed_by::text = $1)`,
        [admin_id || null]
      ),
    ]);

    let all = [
      ...resolutions.rows,
      ...releases.rows,
      ...completions.rows,
    ]
      .filter((r) => r.occurred_at)
      .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

    if (action_type) all = all.filter((r) => r.action.toLowerCase().includes(action_type.toLowerCase()));

    const total = all.length;
    const page_data = all.slice(offset, offset + Number(limit)).map((r, i) => ({
      ...r,
      log_number: `LOG-${String(offset + i + 1).padStart(4, '0')}`,
    }));

    res.json({ logs: page_data, total });
  } catch (err) { next(err); }
}

// ── GET /api/admin/admins ─────────────────────────────────────────────────────

async function getAdmins(req, res, next) {
  try {
    const { search = '' } = req.query;
    const like = `%${search}%`;

    const rows = await db.query(
      `SELECT u.id, u.email, u.role, u.status, u.created_at,
              ap.first_name, ap.last_name, ap.permissions
       FROM users u
       LEFT JOIN admin_profiles ap ON ap.user_id = u.id
       WHERE u.role IN ('admin', 'sub_admin')
         AND (u.email ILIKE $1
              OR ap.first_name ILIKE $1
              OR ap.last_name  ILIKE $1
              OR CONCAT(ap.first_name,' ',ap.last_name) ILIKE $1)
       ORDER BY u.created_at ASC`,
      [like]
    );

    res.json({ admins: rows.rows, total: rows.rows.length });
  } catch (err) { next(err); }
}

// ── POST /api/admin/admins ────────────────────────────────────────────────────
// Creates a sub-admin user + admin_profile (invite flow — password reset on first login)

async function createSubAdmin(req, res, next) {
  try {
    const { full_name, email, permissions = {} } = req.body;
    if (!email || !full_name) return res.status(400).json({ error: 'full_name and email are required' });

    const parts     = full_name.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName  = parts.slice(1).join(' ') || '';

    // Check duplicate
    const exists = await db.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const bcrypt = require('bcryptjs');
    // Temporary random password — admin will need to reset
    const tempPw = await bcrypt.hash(`TMP_${Date.now()}`, 10);

    await db.withTransaction(async (client) => {
      const uRes = await client.query(
        `INSERT INTO users (email, password_hash, role, status, email_verified, created_at, updated_at)
         VALUES ($1, $2, 'sub_admin', 'active', true, NOW(), NOW())
         RETURNING id`,
        [email.toLowerCase(), tempPw]
      );
      const newUserId = uRes.rows[0].id;

      await client.query(
        `INSERT INTO admin_profiles (user_id, first_name, last_name, permissions, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [newUserId, firstName, lastName, JSON.stringify(permissions)]
      );
    });

    res.status(201).json({ message: 'Sub-admin created. Invite sent.' });
  } catch (err) { next(err); }
}

// ── PATCH /api/admin/admins/:id ───────────────────────────────────────────────

async function updateAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { full_name, permissions } = req.body;

    const parts     = (full_name || '').trim().split(/\s+/);
    const firstName = parts[0] || undefined;
    const lastName  = parts.slice(1).join(' ') || undefined;

    await db.query(
      `UPDATE admin_profiles SET
         first_name  = COALESCE($1, first_name),
         last_name   = COALESCE($2, last_name),
         permissions = COALESCE($3, permissions),
         updated_at  = NOW()
       WHERE user_id = $4`,
      [firstName || null, lastName || null, permissions ? JSON.stringify(permissions) : null, id]
    );
    res.json({ message: 'Admin updated' });
  } catch (err) { next(err); }
}

// ── PATCH /api/admin/admins/:id/status ───────────────────────────────────────

async function toggleAdminStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'activate' | 'deactivate'

    if (!['activate', 'deactivate'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Prevent deactivating yourself
    if (id === req.user.id && action === 'deactivate') {
      return res.status(403).json({ error: 'Cannot deactivate your own account' });
    }

    const newStatus = action === 'activate' ? 'active' : 'suspended';
    const result = await db.query(
      `UPDATE users SET status = $1, updated_at = NOW()
       WHERE id = $2 AND role IN ('admin','sub_admin')
       RETURNING id`,
      [newStatus, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Admin not found' });
    res.json({ message: `Admin ${action}d` });
  } catch (err) { next(err); }
}

module.exports = {
  getOverview,
  getOrders,
  getOrder,
  updateVendorOrderStatus,
  getDisputes,
  getDispute,
  startReview,
  updateDisputeNote,
  resolveDispute,
  getVendors,
  getVendor,
  updateVendorStatus,
  getApplications,
  getApplication,
  approveVendor,
  rejectVendor,
  getAdminProducts,
  getAdminProduct,
  updateProductStatus,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  // Payouts
  getPayouts,
  getPayout,
  releasePayout,
  completePayout,
  // Reports
  getSalesAnalytics,
  getVendorPerformance,
  getTransactions,
  // Admin profile
  getAdminProfile,
  updateAdminProfile,
  // Admin management
  getAdmins,
  createSubAdmin,
  updateAdmin,
  toggleAdminStatus,
  // Customers
  getCustomers,
  getCustomer,
  updateCustomerStatus,
  // Notifications
  getNotifications,
  // Refunds
  getRefunds,
  // Audit log
  getAuditLog,
};
