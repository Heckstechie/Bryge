require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const steps = [
      // Deepest dependents first
      `DELETE FROM wallet_transactions
         WHERE wallet_id IN (SELECT id FROM vendor_wallets)`,
      `DELETE FROM payout_requests
         WHERE vendor_id IN (SELECT id FROM vendor_profiles)`,
      `DELETE FROM escrow_transactions
         WHERE vendor_order_id IN (SELECT id FROM vendor_orders)`,
      `DELETE FROM dispute_messages
         WHERE dispute_id IN (
           SELECT id FROM disputes
           WHERE vendor_order_id IN (SELECT id FROM vendor_orders))`,
      `DELETE FROM disputes
         WHERE vendor_order_id IN (SELECT id FROM vendor_orders)`,
      `DELETE FROM order_items
         WHERE vendor_order_id IN (SELECT id FROM vendor_orders)`,
      `DELETE FROM vendor_orders
         WHERE vendor_id IN (SELECT id FROM vendor_profiles)`,
      `DELETE FROM product_images
         WHERE product_id IN (
           SELECT id FROM products WHERE vendor_id IN (SELECT id FROM vendor_profiles))`,
      `DELETE FROM products
         WHERE vendor_id IN (SELECT id FROM vendor_profiles)`,
      `DELETE FROM vendor_wallets
         WHERE vendor_id IN (SELECT id FROM vendor_profiles)`,
      `DELETE FROM vendor_profiles`,
      `DELETE FROM notifications
         WHERE user_id IN (SELECT id FROM users WHERE role = 'vendor')`,
      `DELETE FROM refresh_tokens
         WHERE user_id IN (SELECT id FROM users WHERE role = 'vendor')`,
      `DELETE FROM email_verifications
         WHERE user_id IN (SELECT id FROM users WHERE role = 'vendor')`,
      `DELETE FROM users WHERE role = 'vendor'`,
    ];

    for (const sql of steps) {
      const res = await client.query(sql);
      const table = sql.match(/FROM (\w+)/)[1];
      console.log(`  ✓ ${table}: ${res.rowCount} rows deleted`);
    }

    await client.query('COMMIT');
    console.log('\nDone — all vendor accounts and data wiped.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLED BACK:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
