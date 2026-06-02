const https  = require('https');
const db     = require('../config/database');
const { uploadBuffer } = require('../config/cloudinary');

// ── Paystack helper ───────────────────────────────────────────────────────────

function paystackGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      path,
      method:  'GET',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('Paystack response parse error')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Nigerian banks list ───────────────────────────────────────────────────────
// Cached in memory; refreshed from Paystack on first request (or if Paystack
// key not yet set, falls back to a curated static list).

let banksCache   = null;
let banksCachedAt = 0;
const CACHE_TTL  = 60 * 60 * 1000; // 1 hour

const STATIC_BANKS = [
  { name: 'Access Bank',                  code: '044' },
  { name: 'Citibank Nigeria',             code: '023' },
  { name: 'Ecobank Nigeria',              code: '050' },
  { name: 'Fidelity Bank',               code: '070' },
  { name: 'First Bank of Nigeria',        code: '011' },
  { name: 'First City Monument Bank',     code: '214' },
  { name: 'Guaranty Trust Bank',          code: '058' },
  { name: 'Heritage Bank',               code: '030' },
  { name: 'Keystone Bank',               code: '082' },
  { name: 'Kuda Bank',                   code: '90267' },
  { name: 'Opay',                         code: '100004' },
  { name: 'Palmpay',                      code: '100033' },
  { name: 'Polaris Bank',                 code: '076' },
  { name: 'Stanbic IBTC Bank',            code: '221' },
  { name: 'Standard Chartered',           code: '068' },
  { name: 'Sterling Bank',               code: '232' },
  { name: 'Union Bank of Nigeria',        code: '032' },
  { name: 'United Bank For Africa',       code: '033' },
  { name: 'Unity Bank',                  code: '215' },
  { name: 'Wema Bank',                   code: '035' },
  { name: 'Zenith Bank',                 code: '057' },
];

async function getBanks(req, res, next) {
  try {
    if (banksCache && Date.now() - banksCachedAt < CACHE_TTL) {
      return res.json({ success: true, banks: banksCache });
    }

    if (process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_')) {
      const data = await paystackGet('/bank?currency=NGN&perPage=100');
      if (data.status && Array.isArray(data.data)) {
        banksCache   = data.data.map((b) => ({ name: b.name, code: b.code }));
        banksCachedAt = Date.now();
        return res.json({ success: true, banks: banksCache });
      }
    }

    // Fallback
    return res.json({ success: true, banks: STATIC_BANKS });
  } catch (err) {
    next(err);
  }
}

// ── Resolve account number → account name ────────────────────────────────────

async function resolveAccount(req, res, next) {
  const { account_number, bank_code } = req.query;

  if (!account_number || !bank_code) {
    return res.status(400).json({ success: false, message: 'account_number and bank_code are required' });
  }

  try {
    if (!process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_')) {
      // Dev fallback so the form works without a live key
      return res.json({ success: true, account_name: 'Account Name (test mode)' });
    }

    const data = await paystackGet(
      `/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`
    );

    if (!data.status) {
      return res.status(400).json({ success: false, message: data.message || 'Could not verify account number' });
    }

    return res.json({ success: true, account_name: data.data.account_name });
  } catch (err) {
    next(err);
  }
}

// ── Save bank details ─────────────────────────────────────────────────────────

async function saveBankDetails(req, res, next) {
  const { bank_name, bank_code, account_number, account_name } = req.body;
  const userId = req.user.id;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id, status FROM vendor_profiles WHERE user_id = $1`,
      [userId]
    );

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    if (vendor.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your application must be approved before adding bank details' });
    }

    // Create Paystack transfer recipient for future payouts
    let recipientCode = null;
    if (process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_')) {
      try {
        const body = JSON.stringify({
          type:           'nuban',
          name:           account_name,
          account_number,
          bank_code,
          currency:       'NGN',
        });
        recipientCode = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'api.paystack.co',
            path:     '/transferrecipient',
            method:   'POST',
            headers: {
              Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
            },
          };
          const preq = https.request(options, (pres) => {
            let raw = '';
            pres.on('data', (chunk) => { raw += chunk; });
            pres.on('end', () => {
              try {
                const parsed = JSON.parse(raw);
                resolve(parsed.status ? parsed.data?.recipient_code : null);
              } catch { resolve(null); }
            });
          });
          preq.on('error', reject);
          preq.write(body);
          preq.end();
        });
      } catch { /* recipient creation is non-fatal; retry on payout */ }
    }

    await db.query(
      `UPDATE vendor_profiles
       SET bank_name = $1, bank_code = $2, bank_account_number = $3,
           bank_account_name = $4, paystack_recipient_code = $5, updated_at = NOW()
       WHERE id = $6`,
      [bank_name, bank_code, account_number, account_name, recipientCode, vendor.id]
    );

    return res.json({ success: true, message: 'Bank details saved successfully' });
  } catch (err) {
    next(err);
  }
}

// ── Vendor dashboard stats ────────────────────────────────────────────────────

async function getDashboardStats(req, res, next) {
  const userId = req.user.id;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT vp.id, vp.business_name, vp.logo_url, vp.status, vp.verified,
              vp.bank_account_number,
              vp.total_sales, vp.rating, vp.review_count,
              vw.available_balance, vw.on_hold_balance, vw.total_earned, vw.total_withdrawn
       FROM vendor_profiles vp
       LEFT JOIN vendor_wallets vw ON vw.vendor_id = vp.id
       WHERE vp.user_id = $1`,
      [userId]
    );

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    // This month's sales
    const { rows: [thisMonth] } = await db.query(
      `SELECT COALESCE(SUM(vo.vendor_payout_ngn), 0) AS month_sales
       FROM vendor_orders vo
       WHERE vo.vendor_id = $1
         AND vo.status = 'delivered'
         AND DATE_TRUNC('month', vo.payout_released_at) = DATE_TRUNC('month', NOW())`,
      [vendor.id]
    );

    // Recent pending/processing orders
    let recentOrders = [];
    try {
      const { rows } = await db.query(
        `SELECT vo.id, o.order_ref, vo.created_at, vo.status
         FROM vendor_orders vo
         JOIN orders o ON o.id = vo.order_id
         WHERE vo.vendor_id = $1
           AND vo.status IN ('pending', 'processing')
         ORDER BY vo.created_at DESC
         LIMIT 5`,
        [vendor.id]
      );
      recentOrders = rows;
    } catch { /* orders query is non-fatal */ }

    // Low-stock product count (active, stock 1-5)
    let lowStockCount = 0;
    try {
      const { rows: [sr] } = await db.query(
        `SELECT COUNT(*)::int AS n
         FROM products
         WHERE vendor_id = $1
           AND status = 'active'
           AND stock_quantity > 0
           AND stock_quantity <= 5`,
        [vendor.id]
      );
      lowStockCount = sr?.n || 0;
    } catch { /* non-fatal */ }

    return res.json({
      success: true,
      vendor: {
        id:                 vendor.id,
        business_name:      vendor.business_name,
        logo_url:           vendor.logo_url,
        status:             vendor.status,
        verified:           vendor.verified,
        has_bank_details:   !!vendor.bank_account_number,
      },
      wallet: {
        available_balance: parseFloat(vendor.available_balance || 0),
        on_hold_balance:   parseFloat(vendor.on_hold_balance   || 0),
        total_earned:      parseFloat(vendor.total_earned       || 0),
        total_withdrawn:   parseFloat(vendor.total_withdrawn     || 0),
        month_sales:       parseFloat(thisMonth.month_sales      || 0),
      },
      orders:          recentOrders,
      low_stock_count: lowStockCount,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/vendor/orders — vendor order list with product details ───────────
async function getVendorOrders(req, res, next) {
  const userId = req.user.id;
  const { status } = req.query;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

    const conditions = ['vo.vendor_id = $1'];
    const params     = [vendor.id];

    if (status) {
      // Support comma-separated statuses e.g. dispatched,out_for_delivery
      const statuses = status.split(',').map(s => s.trim());
      params.push(statuses);
      conditions.push(`vo.status = ANY($${params.length})`);
    }

    const { rows } = await db.query(
      `SELECT vo.id, o.order_ref, vo.created_at, vo.status,
              vo.vendor_payout_ngn,
              first_item.quantity,
              first_item.unit_price_ngn  AS price,
              first_item.product_name,
              first_item.product_image
       FROM vendor_orders vo
       JOIN orders o ON o.id = vo.order_id
       LEFT JOIN LATERAL (
         SELECT oi.quantity, oi.unit_price_ngn,
                p.name AS product_name,
                (SELECT url FROM product_images pi
                 WHERE pi.product_id = p.id AND pi.is_primary = true
                 LIMIT 1) AS product_image
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = vo.order_id
           AND oi.vendor_id = vo.vendor_id
         LIMIT 1
       ) first_item ON true
       WHERE ${conditions.join(' AND ')}
       ORDER BY vo.created_at DESC
       LIMIT 50`,
      params
    );

    return res.json({ success: true, orders: rows });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/vendor/orders/:id/status — vendor fulfillment actions ──────────
async function updateVendorOrderStatus(req, res, next) {
  const { id }     = req.params;
  const { action } = req.body; // 'ready_for_pickup' | 'dispatch_to_agent'
  const userId     = req.user.id;

  const TRANSITIONS = {
    ready_for_pickup:  { from: 'pending',    to: 'processing'  },
    dispatch_to_agent: { from: 'processing', to: 'dispatched'  },
  };

  const t = TRANSITIONS[action];
  if (!t) return res.status(400).json({ success: false, message: 'Invalid action' });

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const { rows: [order] } = await db.query(
      `SELECT id, status FROM vendor_orders WHERE id = $1 AND vendor_id = $2`,
      [id, vendor.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== t.from) {
      return res.status(409).json({
        success: false,
        message: `Order is ${order.status}, expected ${t.from}`,
      });
    }

    await db.query(
      `UPDATE vendor_orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [t.to, id]
    );

    return res.json({ success: true, status: t.to });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/vendor/profile — save onboarding data ─────────────────────────
async function updateOnboardingProfile(req, res, next) {
  const { legal_name, country, business_type, industry, registration_type } = req.body;
  try {
    await db.query(
      `UPDATE vendor_profiles
       SET business_name       = COALESCE(NULLIF($1,''), business_name),
           country             = COALESCE(NULLIF($2,''), country),
           business_type       = COALESCE(NULLIF($3,''), business_type),
           industry            = COALESCE(NULLIF($4,''), industry),
           registration_type   = COALESCE(NULLIF($5,''), registration_type),
           updated_at          = NOW()
       WHERE user_id = $6`,
      [legal_name, country, business_type, industry, registration_type, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/vendor/wallet — balance + bank details for withdraw screen ────────
async function getWallet(req, res, next) {
  const userId = req.user.id;
  try {
    const { rows: [vendor] } = await db.query(
      `SELECT vp.bank_name, vp.bank_account_number, vp.bank_account_name,
              vw.available_balance, vw.on_hold_balance, vw.total_earned, vw.total_withdrawn
       FROM vendor_profiles vp
       LEFT JOIN vendor_wallets vw ON vw.vendor_id = vp.id
       WHERE vp.user_id = $1`,
      [userId]
    );
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    return res.json({
      success: true,
      wallet: {
        available_balance: parseFloat(vendor.available_balance || 0),
        on_hold_balance:   parseFloat(vendor.on_hold_balance   || 0),
        total_earned:      parseFloat(vendor.total_earned       || 0),
        total_withdrawn:   parseFloat(vendor.total_withdrawn     || 0),
      },
      bank: vendor.bank_account_number ? {
        bank_name:      vendor.bank_name,
        account_number: vendor.bank_account_number,
        account_name:   vendor.bank_account_name,
      } : null,
    });
  } catch (err) { next(err); }
}

// ── POST /api/vendor/withdraw — submit payout request ─────────────────────────
async function requestWithdrawal(req, res, next) {
  const { amount } = req.body;
  const userId = req.user.id;

  const amt = parseFloat(amount);
  if (!amt || amt <= 0) {
    return res.status(400).json({ success: false, message: 'Enter a valid amount' });
  }

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT vp.id, vp.bank_name, vp.bank_code, vp.bank_account_number, vp.bank_account_name,
              vw.id AS wallet_id, vw.available_balance
       FROM vendor_profiles vp
       LEFT JOIN vendor_wallets vw ON vw.vendor_id = vp.id
       WHERE vp.user_id = $1`,
      [userId]
    );
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    if (!vendor.bank_account_number) {
      return res.status(400).json({ success: false, message: 'Please add your bank details before withdrawing' });
    }
    if (amt > parseFloat(vendor.available_balance || 0)) {
      return res.status(400).json({ success: false, message: 'Amount exceeds your available balance' });
    }

    await db.query(
      `INSERT INTO payout_requests
         (vendor_id, wallet_id, amount, bank_name, bank_account_number, bank_account_name, bank_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [vendor.id, vendor.wallet_id, amt, vendor.bank_name,
       vendor.bank_account_number, vendor.bank_account_name, vendor.bank_code]
    );

    return res.json({ success: true, message: 'Withdrawal request submitted. Our team will process it within 1–3 business days.' });
  } catch (err) { next(err); }
}

// ── GET /api/vendor/transactions — wallet transaction history ─────────────────
async function getTransactions(req, res, next) {
  const userId = req.user.id;
  const { type } = req.query; // 'sale' | 'withdrawal'

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT vw.id AS wallet_id
       FROM vendor_profiles vp
       JOIN vendor_wallets vw ON vw.vendor_id = vp.id
       WHERE vp.user_id = $1`,
      [userId]
    );
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const conditions = ['wt.wallet_id = $1'];
    const params     = [vendor.wallet_id];

    if (type === 'sale') {
      conditions.push(`wt.type IN ('escrow_credit','escrow_release')`);
    } else if (type === 'withdrawal') {
      conditions.push(`wt.type = 'payout'`);
    }

    const { rows } = await db.query(
      `SELECT wt.id, wt.type, wt.amount, wt.description, wt.created_at,
              pr.bank_name AS payout_bank_name,
              first_item.product_name
       FROM wallet_transactions wt
       LEFT JOIN payout_requests pr ON pr.id = wt.payout_request_id
       LEFT JOIN LATERAL (
         SELECT p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN vendor_orders vo2 ON vo2.order_id = oi.order_id AND vo2.id = wt.vendor_order_id
         LIMIT 1
       ) first_item ON true
       WHERE ${conditions.join(' AND ')}
       ORDER BY wt.created_at DESC
       LIMIT 100`,
      params
    );

    return res.json({ success: true, transactions: rows });
  } catch (err) { next(err); }
}

// ── GET /api/vendor/notifications — vendor notification list ──────────────────
async function getVendorNotifications(req, res, next) {
  const userId  = req.user.id;
  const { category } = req.query; // 'orders' | 'payouts' | 'updates'

  const ORDER_TYPE  = ['order_placed','order_confirmed','order_shipped','order_delivered'];
  const PAYOUT_TYPE = ['payment_received','payout_processed','payout_failed','escrow_released'];
  const UPDATE_TYPE = ['low_stock','vendor_approved','vendor_rejected','system','review_posted','dispute_opened','dispute_resolved'];

  try {
    const conditions = ['n.user_id = $1'];
    const params     = [userId];

    if (category === 'orders') {
      params.push(ORDER_TYPE);
      conditions.push(`n.type = ANY($${params.length}::notification_type[])`);
    } else if (category === 'payouts') {
      params.push(PAYOUT_TYPE);
      conditions.push(`n.type = ANY($${params.length}::notification_type[])`);
    } else if (category === 'updates') {
      params.push(UPDATE_TYPE);
      conditions.push(`n.type = ANY($${params.length}::notification_type[])`);
    }

    const { rows } = await db.query(
      `SELECT id, type, title, message, data, read, created_at
       FROM notifications n
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT 100`,
      params
    );

    // Count unread
    const { rows: [{ unread }] } = await db.query(
      `SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    return res.json({ success: true, notifications: rows, unread });
  } catch (err) { next(err); }
}

// ── PATCH /api/vendor/notifications/read — mark all as read ──────────────────
async function markNotificationsRead(req, res, next) {
  const userId = req.user.id;
  try {
    await db.query(
      `UPDATE notifications SET read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );
    return res.json({ success: true });
  } catch (err) { next(err); }
}

// ── Helper: upload a single file buffer to Cloudinary ─────────────────────────
async function uploadDoc(file, folder = 'bryge/vendor-docs') {
  if (!file) return null;
  try {
    const result = await uploadBuffer(file.buffer, {
      folder,
      resource_type: 'auto',   // handles PDF + images
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-z0-9.]/gi, '_')}`,
    });
    return { url: result.secure_url, public_id: result.public_id, name: file.originalname };
  } catch {
    // Cloudinary not configured in dev — store filename as fallback
    return { url: null, name: file.originalname };
  }
}

// ── POST /api/vendor/activate — submit full onboarding application ────────────
async function submitActivation(req, res, next) {
  const userId = req.user.id;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

    // Parse the JSON data payload sent alongside the files
    let payload = {};
    try { payload = JSON.parse(req.body.data || '{}'); } catch { /* use empty */ }

    const { business = {}, registration = {}, people = {}, agreement = {} } = payload;

    // ── Upload every file to Cloudinary ─────────────────────────────────────
    const fileMap = {};
    if (req.files?.length) {
      await Promise.all(req.files.map(async (f) => {
        fileMap[f.fieldname] = await uploadDoc(f);
      }));
    }

    // Separate compliance doc files (fieldnames like doc_cac, doc_tin …)
    const complianceDocs = {};
    Object.entries(fileMap).forEach(([key, val]) => {
      if (key.startsWith('doc_')) complianceDocs[key.replace('doc_', '')] = val;
    });

    // ── Build the verification_documents JSON ────────────────────────────────
    const verificationData = {
      submitted:    true,
      submitted_at: new Date().toISOString(),
      business_type: payload.business_type || 'registered',
      business,
      registration,
      people,
      agreement: {
        ...agreement,
        signed_at: new Date().toISOString(),
      },
      compliance_documents: complianceDocs,
      business_proof: fileMap.business_proof || null,
      reg_doc:        fileMap.reg_doc        || null,
      people_proof:   fileMap.people_proof   || null,
    };

    // ── Update vendor_profiles with all collected data ───────────────────────
    const bizProfile = business.profile  || {};
    const bizContact = business.contact  || {};

    await db.query(
      `UPDATE vendor_profiles
       SET business_name        = COALESCE(NULLIF($1,''),  business_name),
           business_description = COALESCE(NULLIF($2,''),  business_description),
           business_email       = COALESCE(NULLIF($3,''),  business_email),
           business_phone       = COALESCE(NULLIF($4,''),  business_phone),
           verification_documents = $5,
           updated_at           = NOW()
       WHERE id = $6`,
      [
        bizProfile.legal_name   || null,
        bizProfile.description  || null,
        bizContact.business_email || null,
        bizContact.phone          || null,
        JSON.stringify(verificationData),
        vendor.id,
      ]
    );

    // Notify all admins that a new application is ready for review
    const { rows: admins } = await db.query(
      `SELECT id FROM users WHERE role IN ('admin','sub_admin')`
    );
    if (admins.length) {
      const vendorName = bizProfile.legal_name || 'A vendor';
      await Promise.all(admins.map(a =>
        db.query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES ($1, 'vendor_approved', $2, $3, $4)`,
          [
            a.id,
            'New Vendor Application',
            `${vendorName} has submitted their activation application for review.`,
            JSON.stringify({ vendor_id: vendor.id }),
          ]
        ).catch(() => {}) // non-fatal
      ));
    }

    return res.json({ success: true, message: 'Application submitted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBanks, resolveAccount, saveBankDetails,
  getDashboardStats, updateOnboardingProfile,
  getVendorOrders, updateVendorOrderStatus,
  getWallet, requestWithdrawal,
  getTransactions,
  getVendorNotifications, markNotificationsRead,
  submitActivation,
};
