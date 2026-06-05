const db = require('../config/database');
const { uploadBuffer } = require('../config/cloudinary');

async function getActiveBanner(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, image_url, cta_text, cta_url FROM site_banners WHERE active = TRUE ORDER BY updated_at DESC LIMIT 1`
    );
    return res.json({ success: true, banner: rows[0] || null });
  } catch (err) { next(err); }
}

// Admin: create a banner (image file expected in req.file)
async function createBanner(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });

    const img = await uploadBuffer(req.file.buffer, { folder: 'bryge/site-banners' });
    const imageUrl = img?.secure_url || null;

    const { cta_text = null, cta_url = null, active = false } = req.body;

    const { rows } = await db.query(
      `INSERT INTO site_banners (image_url, cta_text, cta_url, active)
       VALUES ($1,$2,$3,$4) RETURNING id, image_url, cta_text, cta_url, active`,
      [imageUrl, cta_text, cta_url, active === 'true' || active === true]
    );

    return res.json({ success: true, banner: rows[0] });
  } catch (err) { next(err); }
}

// Admin: list banners
async function listBanners(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, image_url, cta_text, cta_url, active, created_at, updated_at FROM site_banners ORDER BY created_at DESC`);
    return res.json({ success: true, banners: rows });
  } catch (err) { next(err); }
}

module.exports = { getActiveBanner, createBanner, listBanners };

// Admin: activate a banner (set only this banner active)
async function activateBanner(req, res, next) {
  const { id } = req.params;
  try {
    await db.query('BEGIN');
    // deactivate all
    await db.query(`UPDATE site_banners SET active = FALSE WHERE active = TRUE`);
    // activate selected
    const { rows } = await db.query(
      `UPDATE site_banners SET active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, image_url, cta_text, cta_url, active`,
      [id]
    );
    await db.query('COMMIT');
    return res.json({ success: true, banner: rows[0] || null });
  } catch (err) {
    await db.query('ROLLBACK');
    next(err);
  }
}

module.exports = { getActiveBanner, createBanner, listBanners, activateBanner };
