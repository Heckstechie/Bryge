require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const db = require('../src/config/database');

// Use global fetch (Node 18+)
const fetch = global.fetch || require('node-fetch');

async function main() {
  const email = process.argv[2] || `testvendor+${Date.now()}@example.com`;
  console.log('Registering:', email);
  try {
    const resp = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'Vendor',
        email,
        password: 'Password1',
        password_confirm: 'Password1',
        role: 'vendor'
      })
    });
    let reg;
    try {
      reg = await resp.json();
    } catch (e) {
      const text = await resp.text().catch(() => '<no body>');
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }
    if (!resp.ok) throw new Error(JSON.stringify(reg));
    console.log('Register response:', reg.message || JSON.stringify(reg));
  } catch (err) {
    console.error('Register failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }

  // Wait a moment for DB insert
  await new Promise(r => setTimeout(r, 500));

  try {
    const { rows: [user] } = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!user) throw new Error('User not found');
    const { rows } = await db.query(
      `SELECT token, expires_at FROM email_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );
    if (!rows || rows.length === 0) {
      console.log('No verification code found (SKIP_EMAIL_VERIFICATION may be true).');
      process.exit(0);
    }
    const rec = rows[0];
    console.log('OTP:', rec.token, 'expires_at:', rec.expires_at);
  } catch (err) {
    console.error('Error fetching OTP:', err.message);
  } finally {
    process.exit(0);
  }
}

main();
