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
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node bypass-activation.js user@example.com');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: users } = await client.query(
      `SELECT id, role, status FROM users WHERE lower(email) = lower($1)`,
      [email.trim()]
    );

    if (users.length === 0) {
      throw new Error(`No user found with email ${email}`);
    }

    const user = users[0];
    if (user.role !== 'vendor') {
      throw new Error(`User ${email} is not a vendor account (role=${user.role})`);
    }

    const { rows: vendorRows } = await client.query(
      `SELECT id, status, verified FROM vendor_profiles WHERE user_id = $1`,
      [user.id]
    );

    if (vendorRows.length === 0) {
      throw new Error(`Vendor profile not found for user ${email}`);
    }

    const vendor = vendorRows[0];

    await client.query(
      `UPDATE users
       SET status = 'active', email_verified = TRUE, updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    await client.query(
      `UPDATE vendor_profiles
       SET status = 'active', verified = TRUE, updated_at = NOW()
       WHERE user_id = $1`,
      [user.id]
    );

    await client.query('COMMIT');
    console.log(`Vendor activation bypassed for ${email}`);
    console.log(`- user.status => active`);
    console.log(`- user.email_verified => true`);
    console.log(`- vendor_profiles.status => active`);
    console.log(`- vendor_profiles.verified => true`);

    if (vendor.status !== 'active' || !vendor.verified) {
      console.log('Note: this account is now active and verified in the DB.');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to bypass activation:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
