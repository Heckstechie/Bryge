const db = require('../config/database');

async function getProfile(req, res, next) {
  try {
    const { rows: [profile] } = await db.query(
      `SELECT u.id, u.email, u.role, u.email_verified, u.created_at,
              COALESCE(cp.first_name, '') AS first_name,
              COALESCE(cp.last_name, '') AS last_name,
              COALESCE(cp.avatar_url, '') AS avatar_url,
              COALESCE(cp.date_of_birth, '') AS date_of_birth,
              COALESCE(cp.country, '') AS country,
              COALESCE(cp.city, '') AS city
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!profile) return res.status(404).json({ success: false, message: 'Customer profile not found' });
    return res.json({ success: true, profile });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  const { first_name, last_name, date_of_birth, country, city } = req.body;
  const userId = req.user.id;

  try {
    const updates = [];
    const params = [];

    if (first_name !== undefined) { params.push(first_name); updates.push(`first_name = $${params.length}`); }
    if (last_name !== undefined)  { params.push(last_name);  updates.push(`last_name = $${params.length}`); }
    if (date_of_birth !== undefined) { params.push(date_of_birth); updates.push(`date_of_birth = $${params.length}`); }
    if (country !== undefined)    { params.push(country);    updates.push(`country = $${params.length}`); }
    if (city !== undefined)       { params.push(city);       updates.push(`city = $${params.length}`); }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No profile fields provided' });
    }

    params.push(userId);
    await db.query(
      `UPDATE customer_profiles SET ${updates.join(', ')}, updated_at = NOW()
       WHERE user_id = $${params.length}`,
      params
    );

    return res.json({ success: true, message: 'Profile updated' });
  } catch (err) { next(err); }
}

async function getAddresses(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, label, recipient_name, phone, address_line1, address_line2,
              city, state, country, postal_code, is_default, created_at
       FROM addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, addresses: rows });
  } catch (err) { next(err); }
}

async function createAddress(req, res, next) {
  const { label, recipient_name, phone, address_line1, address_line2,
          city, state, country, postal_code, is_default } = req.body;
  const userId = req.user.id;

  try {
    await db.withTransaction(async (client) => {
      if (is_default) {
        await client.query(
          `UPDATE addresses SET is_default = FALSE WHERE user_id = $1`,
          [userId]
        );
      }

      const { rows: [address] } = await client.query(
        `INSERT INTO addresses (user_id, label, recipient_name, phone, address_line1,
                                address_line2, city, state, country, postal_code, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [userId, label || 'Home', recipient_name, phone, address_line1,
         address_line2 || null, city, state, country, postal_code || null, !!is_default]
      );

      return res.json({ success: true, address });
    });
  } catch (err) { next(err); }
}

async function updateAddress(req, res, next) {
  const { id } = req.params;
  const { label, recipient_name, phone, address_line1, address_line2,
          city, state, country, postal_code, is_default } = req.body;
  const userId = req.user.id;

  try {
    await db.withTransaction(async (client) => {
      const { rows: [existing] } = await client.query(
        `SELECT id FROM addresses WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      if (!existing) return res.status(404).json({ success: false, message: 'Address not found' });

      if (is_default) {
        await client.query(
          `UPDATE addresses SET is_default = FALSE WHERE user_id = $1`,
          [userId]
        );
      }

      const updates = [];
      const params = [];
      if (label !== undefined)         { params.push(label); updates.push(`label = $${params.length}`); }
      if (recipient_name !== undefined){ params.push(recipient_name); updates.push(`recipient_name = $${params.length}`); }
      if (phone !== undefined)         { params.push(phone); updates.push(`phone = $${params.length}`); }
      if (address_line1 !== undefined) { params.push(address_line1); updates.push(`address_line1 = $${params.length}`); }
      if (address_line2 !== undefined) { params.push(address_line2); updates.push(`address_line2 = $${params.length}`); }
      if (city !== undefined)          { params.push(city); updates.push(`city = $${params.length}`); }
      if (state !== undefined)         { params.push(state); updates.push(`state = $${params.length}`); }
      if (country !== undefined)       { params.push(country); updates.push(`country = $${params.length}`); }
      if (postal_code !== undefined)   { params.push(postal_code); updates.push(`postal_code = $${params.length}`); }
      if (is_default !== undefined)    { params.push(!!is_default); updates.push(`is_default = $${params.length}`); }

      if (!updates.length) {
        return res.status(400).json({ success: false, message: 'No address fields provided' });
      }

      params.push(id);
      await client.query(
        `UPDATE addresses SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params
      );

      return res.json({ success: true, message: 'Address updated' });
    });
  } catch (err) { next(err); }
}

async function deleteAddress(req, res, next) {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query(
      `DELETE FROM addresses WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ success: false, message: 'Address not found' });
    return res.json({ success: true, message: 'Address deleted' });
  } catch (err) { next(err); }
}

async function getNotifications(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, type, title, message, data, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    const { rows: [countRow] } = await db.query(
      `SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = $1 AND read = FALSE`,
      [req.user.id]
    );

    return res.json({ success: true, notifications: rows, unread: countRow.unread });
  } catch (err) { next(err); }
}

async function markNotificationsRead(req, res, next) {
  try {
    await db.query(
      `UPDATE notifications SET read = TRUE, read_at = NOW() WHERE user_id = $1 AND read = FALSE`,
      [req.user.id]
    );
    return res.json({ success: true });
  } catch (err) { next(err); }
}

async function getReviews(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.rating, r.title, r.body, r.verified_purchase, r.created_at,
              p.id AS product_id, p.name AS product_name, p.product_image
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       WHERE r.customer_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, reviews: rows });
  } catch (err) { next(err); }
}

async function createReview(req, res, next) {
  const { order_item_id, rating, title, body } = req.body;
  const userId = req.user.id;

  try {
    const { rows: [item] } = await db.query(
      `SELECT oi.id AS order_item_id, oi.product_id, o.id AS order_id, o.status
       FROM order_items oi
       JOIN vendor_orders vo ON vo.id = oi.vendor_order_id
       JOIN orders o ON o.id = vo.order_id
       WHERE oi.id = $1 AND o.customer_id = $2`,
      [order_item_id, userId]
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    if (!['delivered','completed'].includes(item.status)) {
      return res.status(400).json({ success: false, message: 'Reviews can only be submitted after delivery' });
    }

    const { rows: [review] } = await db.query(
      `INSERT INTO reviews (product_id, customer_id, order_item_id, rating, title, body, verified_purchase)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)
       RETURNING id, product_id, customer_id, order_item_id, rating, title, body, verified_purchase, created_at`,
      [item.product_id, userId, order_item_id, rating, title || null, body || null]
    );

    return res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'A review for this order item already exists' });
    }
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getNotifications,
  markNotificationsRead,
  getReviews,
  createReview,
};
