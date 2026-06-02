const db             = require('../config/database');
const { uploadBuffer } = require('../config/cloudinary');

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' + Date.now();
}

function nairaFormat(n) { return Number(n); }

// Has this vendor ever had a live (approved) product before?
async function vendorHasLiveProducts(vendorId) {
  const { rows } = await db.query(
    `SELECT 1 FROM products WHERE vendor_id = $1 AND status = 'active' LIMIT 1`,
    [vendorId]
  );
  return rows.length > 0;
}

// ── Public: list products ─────────────────────────────────────────────────────

async function listProducts(req, res, next) {
  try {
    const {
      search, category, min_price, max_price, rating,
      page = 1, limit = 20,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build dynamic WHERE conditions
    const conditions = [`p.status = 'active'`];
    const params     = [];
    let   idx        = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.tags && ARRAY[$${idx}]::text[])`);
      params.push(`%${search}%`);
      idx++;
    }
    if (category) {
      // Include the category AND all its sub-categories
      conditions.push(`(p.category_id = $${idx} OR c.parent_id = $${idx})`);
      params.push(category);
      idx++;
    }
    if (min_price) {
      conditions.push(`p.price >= $${idx}`);
      params.push(Number(min_price));
      idx++;
    }
    if (max_price) {
      conditions.push(`p.price <= $${idx}`);
      params.push(Number(max_price));
      idx++;
    }
    if (rating) {
      conditions.push(`p.rating >= $${idx}`);
      params.push(Number(rating));
      idx++;
    }

    const where = conditions.join(' AND ');

    const [{ rows: products }, { rows: [{ total }] }] = await Promise.all([
      db.query(
        `SELECT p.id, p.name, p.slug, p.price, p.compare_price,
                p.stock_quantity, p.rating, p.review_count, p.status,
                p.is_featured, p.created_at,
                c.name AS category_name, c.slug AS category_slug,
                vp.business_name AS vendor_name, vp.slug AS vendor_slug,
                (SELECT url FROM product_images
                 WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS primary_image
         FROM products p
         JOIN categories c  ON c.id  = p.category_id
         JOIN vendor_profiles vp ON vp.id = p.vendor_id
         WHERE ${where}
         ORDER BY p.is_featured DESC, p.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, Number(limit), offset]
      ),
      db.query(
        `SELECT COUNT(*) AS total
         FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE ${where}`,
        params
      ),
    ]);

    return res.json({
      success: true,
      products,
      pagination: {
        total: Number(total),
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(Number(total) / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Public: single product detail ─────────────────────────────────────────────

async function getProduct(req, res, next) {
  try {
    const { id } = req.params;

    const { rows: [product] } = await db.query(
      `SELECT p.*,
              c.name AS category_name, c.slug AS category_slug, c.commission_rate,
              vp.business_name, vp.slug AS vendor_slug, vp.rating AS vendor_rating,
              vp.review_count AS vendor_review_count
       FROM products p
       JOIN categories c  ON c.id  = p.category_id
       JOIN vendor_profiles vp ON vp.id = p.vendor_id
       WHERE p.id = $1 AND p.status = 'active'`,
      [id]
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Images
    const { rows: images } = await db.query(
      `SELECT id, url, alt_text, is_primary, sort_order
       FROM product_images WHERE product_id = $1 ORDER BY sort_order, is_primary DESC`,
      [id]
    );

    // Variants
    const { rows: variants } = await db.query(
      `SELECT id, name, value, price_adjustment, stock_quantity
       FROM product_variants WHERE product_id = $1`,
      [id]
    );

    // Rating distribution
    const { rows: ratingDist } = await db.query(
      `SELECT rating, COUNT(*) AS count
       FROM reviews WHERE product_id = $1 AND approved = TRUE
       GROUP BY rating ORDER BY rating DESC`,
      [id]
    );

    // Reviews (latest 4)
    const { rows: reviews } = await db.query(
      `SELECT r.id, r.rating, r.title, r.body, r.verified_purchase,
              r.helpful_count, r.created_at,
              cp.first_name, cp.last_name
       FROM reviews r
       JOIN users u  ON u.id  = r.customer_id
       JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE r.product_id = $1 AND r.approved = TRUE
       ORDER BY r.created_at DESC LIMIT 4`,
      [id]
    );

    // Related products
    const { rows: related } = await db.query(
      `SELECT p.id, p.name, p.price, p.rating, p.review_count, p.stock_quantity,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS primary_image
       FROM products p
       WHERE p.category_id = $1 AND p.id != $2 AND p.status = 'active'
       ORDER BY p.rating DESC LIMIT 5`,
      [product.category_id, id]
    );

    // Increment view (fire-and-forget)
    db.query(`UPDATE products SET total_sold = total_sold WHERE id = $1`, [id]).catch(() => {});

    return res.json({
      success: true,
      product: { ...product, images, variants },
      rating_distribution: ratingDist,
      reviews,
      related,
    });
  } catch (err) {
    next(err);
  }
}

// ── Vendor: create product ────────────────────────────────────────────────────

async function createProduct(req, res, next) {
  const userId = req.user.id;
  const {
    name, category_id, description, short_description,
    price, compare_price, cost_price, sku,
    stock_quantity = 0, low_stock_threshold = 5,
    weight_kg, tags,
  } = req.body;

  try {
    // Verify vendor is approved
    const { rows: [vendor] } = await db.query(
      `SELECT id, status FROM vendor_profiles WHERE user_id = $1`,
      [userId]
    );
    if (!vendor || vendor.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Only approved vendors can create products' });
    }

    // Get commission rate from category
    const { rows: [cat] } = await db.query(
      `SELECT id, commission_rate FROM categories WHERE id = $1 AND active = TRUE`,
      [category_id]
    );
    if (!cat) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    // First-product rule: goes to draft if vendor has no live products yet
    const isFirstTime = !(await vendorHasLiveProducts(vendor.id));
    const initialStatus = isFirstTime ? 'draft' : 'active';

    const slug = toSlug(name);

    const { rows: [product] } = await db.query(
      `INSERT INTO products
         (vendor_id, category_id, name, slug, description, short_description,
          price, compare_price, cost_price, sku, stock_quantity,
          low_stock_threshold, weight_kg, status, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        vendor.id, category_id, name.trim(), slug,
        description || null, short_description || null,
        nairaFormat(price),
        compare_price ? nairaFormat(compare_price) : null,
        cost_price    ? nairaFormat(cost_price)    : null,
        sku || null,
        Number(stock_quantity),
        Number(low_stock_threshold),
        weight_kg ? Number(weight_kg) : null,
        initialStatus,
        tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      ]
    );

    return res.status(201).json({
      success: true,
      product,
      requires_approval: isFirstTime,
      message: isFirstTime
        ? 'Product submitted for admin review. It will go live once approved.'
        : 'Product created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ── Vendor: update product ────────────────────────────────────────────────────

async function updateProduct(req, res, next) {
  const userId = req.user.id;
  const { id }  = req.params;
  const {
    name, category_id, description, short_description,
    price, compare_price, cost_price, sku,
    stock_quantity, low_stock_threshold, weight_kg, tags,
  } = req.body;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(403).json({ success: false, message: 'Vendor not found' });

    const { rows: [existing] } = await db.query(
      `SELECT id, status FROM products WHERE id = $1 AND vendor_id = $2`,
      [id, vendor.id]
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const setClauses = [];
    const params     = [];
    let   idx        = 1;

    const fields = { name, category_id, description, short_description, price,
      compare_price, cost_price, sku, stock_quantity, low_stock_threshold, weight_kg };

    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        setClauses.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      }
    }
    if (tags !== undefined) {
      setClauses.push(`tags = $${idx}`);
      params.push(Array.isArray(tags) ? tags : [tags]);
      idx++;
    }
    if (name) {
      setClauses.push(`slug = $${idx}`);
      params.push(toSlug(name));
      idx++;
    }
    // Auto out_of_stock detection
    if (stock_quantity !== undefined && Number(stock_quantity) === 0) {
      setClauses.push(`status = $${idx}`);
      params.push('out_of_stock');
      idx++;
    } else if (stock_quantity !== undefined && Number(stock_quantity) > 0 &&
               existing.status === 'out_of_stock') {
      setClauses.push(`status = $${idx}`);
      params.push('active');
      idx++;
    }

    if (!setClauses.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const { rows: [updated] } = await db.query(
      `UPDATE products SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING *`,
      params
    );

    return res.json({ success: true, product: updated });
  } catch (err) {
    next(err);
  }
}

// ── Vendor: toggle active / inactive ─────────────────────────────────────────

async function toggleStatus(req, res, next) {
  const userId = req.user.id;
  const { id }  = req.params;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(403).json({ success: false, message: 'Vendor not found' });

    const { rows: [product] } = await db.query(
      `SELECT id, status FROM products WHERE id = $1 AND vendor_id = $2`,
      [id, vendor.id]
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.status === 'out_of_stock') {
      return res.status(400).json({ success: false, message: 'Cannot toggle an out-of-stock product. Update stock quantity first.' });
    }

    const newStatus = product.status === 'active' ? 'suspended' : 'active';

    await db.query(
      `UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, id]
    );

    return res.json({ success: true, status: newStatus });
  } catch (err) {
    next(err);
  }
}

// ── Vendor: soft-delete product ───────────────────────────────────────────────

async function deleteProduct(req, res, next) {
  const userId = req.user.id;
  const { id }  = req.params;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(403).json({ success: false, message: 'Vendor not found' });

    const { rowCount } = await db.query(
      `UPDATE products SET status = 'deleted', updated_at = NOW()
       WHERE id = $1 AND vendor_id = $2 AND status != 'deleted'`,
      [id, vendor.id]
    );
    if (!rowCount) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

// ── Vendor: upload images ─────────────────────────────────────────────────────

async function uploadImages(req, res, next) {
  const userId = req.user.id;
  const { id }  = req.params;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No images provided' });
  }

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(403).json({ success: false, message: 'Vendor not found' });

    const { rows: [product] } = await db.query(
      `SELECT id FROM products WHERE id = $1 AND vendor_id = $2 AND status != 'deleted'`,
      [id, vendor.id]
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check total image count (max 5)
    const { rows: [{ count }] } = await db.query(
      `SELECT COUNT(*) FROM product_images WHERE product_id = $1`, [id]
    );
    const remaining = 5 - Number(count);
    if (remaining <= 0) {
      return res.status(400).json({ success: false, message: 'Maximum 5 images per product' });
    }

    const files    = req.files.slice(0, remaining);
    const hasPrimary = Number(count) > 0;

    const uploaded = await Promise.all(
      files.map((file, i) =>
        uploadBuffer(file.buffer, {
          public_id: `product_${id}_${Date.now()}_${i}`,
          transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
        })
      )
    );

    const saved = await Promise.all(
      uploaded.map((result, i) =>
        db.query(
          `INSERT INTO product_images (product_id, url, is_primary, sort_order)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [id, result.secure_url, !hasPrimary && i === 0, Number(count) + i]
        ).then(({ rows: [r] }) => r)
      )
    );

    return res.status(201).json({ success: true, images: saved });
  } catch (err) {
    next(err);
  }
}

// ── Vendor: my products list ──────────────────────────────────────────────────

async function vendorProducts(req, res, next) {
  const userId = req.user.id;
  const { status, search, page = 1, limit = 20 } = req.query;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(403).json({ success: false, message: 'Vendor not found' });

    const conditions = [`p.vendor_id = $1`, `p.status != 'deleted'`];
    const params     = [vendor.id];
    let   idx        = 2;

    // Map UI status names to DB values
    const statusMap = { active: 'active', out_of_stock: 'out_of_stock', inactive: 'suspended', draft: 'draft' };
    if (status && statusMap[status]) {
      conditions.push(`p.status = $${idx}`);
      params.push(statusMap[status]);
      idx++;
    }
    if (search) {
      conditions.push(`p.name ILIKE $${idx}`);
      params.push(`%${search}%`);
      idx++;
    }

    const offset = (Number(page) - 1) * Number(limit);
    const where  = conditions.join(' AND ');

    const { rows: products } = await db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.stock_quantity,
              p.status, p.rating, p.review_count, p.created_at,
              c.name AS category_name,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS primary_image
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), offset]
    );

    return res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
}

// ── Vendor: get single product (own) for editing ──────────────────────────────

async function vendorGetProduct(req, res, next) {
  const userId = req.user.id;
  const { id }  = req.params;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(403).json({ success: false, message: 'Vendor not found' });

    const { rows: [product] } = await db.query(
      `SELECT p.*, c.name AS category_name, c.parent_id AS category_parent_id
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1 AND p.vendor_id = $2 AND p.status != 'deleted'`,
      [id, vendor.id]
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { rows: images } = await db.query(
      `SELECT id, url, is_primary, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order`,
      [id]
    );

    return res.json({ success: true, product: { ...product, images } });
  } catch (err) {
    next(err);
  }
}

// ── Vendor: delete a single image ─────────────────────────────────────────────

async function deleteImage(req, res, next) {
  const userId    = req.user.id;
  const { id, imageId } = req.params;

  try {
    const { rows: [vendor] } = await db.query(
      `SELECT id FROM vendor_profiles WHERE user_id = $1`, [userId]
    );
    if (!vendor) return res.status(403).json({ success: false, message: 'Vendor not found' });

    // Verify product belongs to vendor
    const { rows: [product] } = await db.query(
      `SELECT id FROM products WHERE id = $1 AND vendor_id = $2`, [id, vendor.id]
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { rowCount } = await db.query(
      `DELETE FROM product_images WHERE id = $1 AND product_id = $2`, [imageId, id]
    );
    if (!rowCount) return res.status(404).json({ success: false, message: 'Image not found' });

    // If we deleted the primary, promote the next image
    await db.query(
      `UPDATE product_images SET is_primary = TRUE
       WHERE product_id = $1
         AND id = (SELECT id FROM product_images WHERE product_id = $1 ORDER BY sort_order LIMIT 1)
         AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = $1 AND is_primary = TRUE)`,
      [id]
    );

    return res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts, getProduct, createProduct, updateProduct,
  toggleStatus, deleteProduct, uploadImages, vendorProducts,
  vendorGetProduct, deleteImage,
};
