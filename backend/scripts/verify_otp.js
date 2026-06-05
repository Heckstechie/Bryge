require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fetch = global.fetch || require('node-fetch');

async function main() {
  const email = process.argv[2];
  const code = process.argv[3];
  if (!email || !code) {
    console.error('Usage: node verify_otp.js <email> <code>');
    process.exit(1);
  }
  try {
    const resp = await fetch('http://localhost:5000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await resp.json();
    console.log('Verify response:', data);
  } catch (err) {
    console.error('Verify failed:', err.message);
  }
}

main();
