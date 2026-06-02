const db = require('../config/database');

async function getAll(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT id, name, slug, description, image_url, commission_rate,
             parent_id, active, sort_order
      FROM categories
      WHERE active = TRUE
      ORDER BY parent_id NULLS FIRST, sort_order, name
    `);

    // Nest sub-categories under their parents
    const top  = rows.filter((r) => !r.parent_id);
    const subs = rows.filter((r) =>  r.parent_id);

    const tree = top.map((cat) => ({
      ...cat,
      sub_categories: subs.filter((s) => String(s.parent_id) === String(cat.id)),
    }));

    return res.json({ success: true, categories: tree });
  } catch (err) {
    next(err);
  }
}

// Public flat list used by product filter sidebar (includes product counts)
async function getWithCounts(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT c.id, c.name, c.slug, c.commission_rate, c.parent_id,
             COUNT(p.id) FILTER (WHERE p.status = 'active') AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      WHERE c.active = TRUE
      GROUP BY c.id
      ORDER BY c.parent_id NULLS FIRST, c.sort_order
    `);
    return res.json({ success: true, categories: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getWithCounts };
