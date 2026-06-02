const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const { v4: uuidv4 } = require('uuid');

const db                                   = require('../config/database');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const { sendVerificationCode, sendPasswordReset } = require('../utils/email');

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function tokenHash(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

// ── Register ──────────────────────────────────────────────────────────────────

async function register(req, res, next) {
  const { first_name, last_name, email, password, role = 'customer' } = req.body;

  if (!['customer', 'vendor'].includes(role)) {
    return fail(res, 'Invalid role');
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return fail(res, 'An account with this email already exists');
    }

    const password_hash = await bcrypt.hash(password, 12);

    await db.withTransaction(async (client) => {
      // Create user
      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, password_hash, role, status, email_verified)
         VALUES ($1, $2, $3, 'active', FALSE) RETURNING id, email, role`,
        [email.toLowerCase(), password_hash, role]
      );

      // Create profile
      if (role === 'customer') {
        await client.query(
          `INSERT INTO customer_profiles (user_id, first_name, last_name)
           VALUES ($1, $2, $3)`,
          [user.id, first_name.trim(), last_name.trim()]
        );
      } else {
        // vendor — full registration form submitted in one call
        const {
          business_name, business_email, business_phone,
          business_address, city, state, country, registration_number,
        } = req.body;

        const slug = `${(business_name || `${first_name}-${last_name}`).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;

        await client.query(
          `INSERT INTO vendor_profiles
             (user_id, business_name, business_email, business_phone,
              business_description, slug, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [
            user.id,
            (business_name || `${first_name} ${last_name}`).trim(),
            business_email || null,
            business_phone || null,
            JSON.stringify({ first_name, last_name, address: business_address, city, state, country, registration_number }),
            slug,
          ]
        );

        // Create wallet immediately so dashboard stats work from day 1
        await client.query(
          `INSERT INTO vendor_wallets (vendor_id)
           SELECT id FROM vendor_profiles WHERE user_id = $1`,
          [user.id]
        );
      }

      // ── DEV ONLY: auto-verify when SKIP_EMAIL_VERIFICATION=true ─────────────
      if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
        await client.query(
          `UPDATE users SET email_verified = TRUE WHERE id = $1`,
          [user.id]
        );
      } else {
        // Generate and store OTP
        const code = generateOtp();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        await client.query(
          `INSERT INTO email_verifications (user_id, token, expires_at)
           VALUES ($1, $2, $3)`,
          [user.id, code, expires]
        );
        await sendVerificationCode(user.email, code);
      }
    });

    const skipVerify = process.env.SKIP_EMAIL_VERIFICATION === 'true';
    return ok(res, {
      message: skipVerify
        ? 'Account created. Email auto-verified (dev mode).'
        : 'Account created. Check your email for a verification code.',
      dev_auto_verified: skipVerify || undefined,
    }, 201);
  } catch (err) {
    next(err);
  }
}

// ── Verify Email ──────────────────────────────────────────────────────────────

async function verifyEmail(req, res, next) {
  const { email, code } = req.body;

  try {
    const { rows: [user] } = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (!user) return fail(res, 'Invalid code');

    const { rows: [record] } = await db.query(
      `SELECT id, expires_at FROM email_verifications
       WHERE user_id = $1 AND token = $2 AND used = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, code]
    );

    if (!record) return fail(res, 'Invalid or expired code');
    if (new Date(record.expires_at) < new Date()) return fail(res, 'Code has expired');

    await db.withTransaction(async (client) => {
      await client.query(
        `UPDATE email_verifications SET used = TRUE WHERE id = $1`,
        [record.id]
      );
      await client.query(
        `UPDATE users SET email_verified = TRUE WHERE id = $1`,
        [user.id]
      );
    });

    const { rows: [fullUser] } = await db.query(
      `SELECT u.id, u.email, u.role,
              COALESCE(cp.first_name, vp.business_name) AS display_name
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       LEFT JOIN vendor_profiles   vp ON vp.user_id = u.id
       WHERE u.id = $1`,
      [user.id]
    );

    const accessToken  = signAccess({ id: fullUser.id, role: fullUser.role });
    const refreshToken = signRefresh({ id: fullUser.id });
    await storeRefreshToken(fullUser.id, refreshToken, req);

    return ok(res, {
      message: 'Email verified successfully',
      user: { id: fullUser.id, email: fullUser.email, role: fullUser.role, display_name: fullUser.display_name },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── Resend Verification Code ──────────────────────────────────────────────────

async function resendCode(req, res, next) {
  const { email } = req.body;

  try {
    const { rows: [user] } = await db.query(
      `SELECT id, email_verified FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    // Always return 200 (prevents email enumeration)
    if (!user || user.email_verified) {
      return ok(res, { message: 'If that email exists, a new code has been sent.' });
    }

    // Invalidate old codes
    await db.query(
      `UPDATE email_verifications SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
      [user.id]
    );

    const code    = generateOtp();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await db.query(
      `INSERT INTO email_verifications (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, code, expires]
    );

    await sendVerificationCode(email.toLowerCase(), code);
    return ok(res, { message: 'If that email exists, a new code has been sent.' });
  } catch (err) {
    next(err);
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const { rows: [user] } = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.status, u.email_verified,
              COALESCE(cp.first_name, vp.business_name) AS display_name,
              COALESCE(cp.avatar_url, vp.logo_url)      AS avatar_url,
              vp.status AS vendor_status
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       LEFT JOIN vendor_profiles   vp ON vp.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return fail(res, 'Invalid email or password', 401);
    }

    if (user.status === 'suspended') {
      return fail(res, 'Your account has been suspended. Contact support.', 403);
    }

    if (!user.email_verified) {
      return fail(res, 'Please verify your email before logging in.', 403);
    }

    await db.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    const accessToken  = signAccess({ id: user.id, role: user.role });
    const refreshToken = signRefresh({ id: user.id });
    await storeRefreshToken(user.id, refreshToken, req);

    return ok(res, {
      user: {
        id:            user.id,
        email:         user.email,
        role:          user.role,
        display_name:  user.display_name,
        avatar_url:    user.avatar_url,
        vendor_status: user.vendor_status ?? null,
      },
      access_token:  accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

async function refresh(req, res, next) {
  const { refresh_token } = req.body;
  if (!refresh_token) return fail(res, 'Refresh token required', 401);

  try {
    const payload = verifyRefresh(refresh_token);
    const hash    = tokenHash(refresh_token);

    const { rows: [stored] } = await db.query(
      `SELECT id, revoked, expires_at FROM refresh_tokens
       WHERE token_hash = $1 AND user_id = $2`,
      [hash, payload.id]
    );

    if (!stored || stored.revoked || new Date(stored.expires_at) < new Date()) {
      return fail(res, 'Invalid or expired refresh token', 401);
    }

    const { rows: [user] } = await db.query(
      `SELECT id, email, role, status FROM users WHERE id = $1`,
      [payload.id]
    );

    if (!user || user.status !== 'active') {
      return fail(res, 'Account unavailable', 403);
    }

    // Rotate: revoke old, issue new
    await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [stored.id]);

    const newAccess  = signAccess({ id: user.id, role: user.role });
    const newRefresh = signRefresh({ id: user.id });
    await storeRefreshToken(user.id, newRefresh, req);

    return ok(res, { access_token: newAccess, refresh_token: newRefresh });
  } catch {
    return fail(res, 'Invalid or expired refresh token', 401);
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

async function logout(req, res, next) {
  const { refresh_token } = req.body;

  try {
    if (refresh_token) {
      await db.query(
        `UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`,
        [tokenHash(refresh_token)]
      );
    }
    return ok(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// ── Forgot Password ───────────────────────────────────────────────────────────

async function forgotPassword(req, res, next) {
  const { email } = req.body;

  try {
    const { rows: [user] } = await db.query(
      `SELECT id FROM users WHERE email = $1 AND status = 'active'`,
      [email.toLowerCase()]
    );

    // Always 200 (prevents email enumeration)
    if (!user) {
      return ok(res, { message: 'If that email is registered, a reset link has been sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expires  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate existing unused resets
    await db.query(
      `UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
      [user.id]
    );

    await db.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash(rawToken), expires]
    );

    await sendPasswordReset(email.toLowerCase(), rawToken);
    return ok(res, { message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

// ── Reset Password ────────────────────────────────────────────────────────────

async function resetPassword(req, res, next) {
  const { token, password } = req.body;

  try {
    const { rows: [record] } = await db.query(
      `SELECT id, user_id, expires_at FROM password_resets
       WHERE token_hash = $1 AND used = FALSE`,
      [tokenHash(token)]
    );

    if (!record) return fail(res, 'Invalid or expired reset link');
    if (new Date(record.expires_at) < new Date()) return fail(res, 'Reset link has expired');

    const password_hash = await bcrypt.hash(password, 12);

    await db.withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [password_hash, record.user_id]
      );
      await client.query(
        `UPDATE password_resets SET used = TRUE WHERE id = $1`,
        [record.id]
      );
      // Revoke all refresh tokens for security
      await client.query(
        `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
        [record.user_id]
      );
    });

    return ok(res, { message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

// ── Me (current user) ─────────────────────────────────────────────────────────

async function me(req, res, next) {
  try {
    const { rows: [user] } = await db.query(
      `SELECT u.id, u.email, u.role, u.email_verified, u.created_at,
              COALESCE(cp.first_name, vp.business_name) AS display_name,
              cp.last_name,
              COALESCE(cp.avatar_url, vp.logo_url)      AS avatar_url,
              vp.status AS vendor_status
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       LEFT JOIN vendor_profiles   vp ON vp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!user) return fail(res, 'User not found', 404);
    return ok(res, { user });
  } catch (err) {
    next(err);
  }
}

// ── Internal: store refresh token ─────────────────────────────────────────────

async function storeRefreshToken(userId, rawToken, req) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      tokenHash(rawToken),
      expires,
      req.headers['user-agent'] || null,
      req.ip || null,
    ]
  );
}

// ── Admin Login (dedicated — skips email_verified, role-gated) ───────────────

async function adminLogin(req, res, next) {
  const { email, password } = req.body;

  try {
    // Explicit role filter — never match customer/vendor accounts
    const { rows } = await db.query(
      `SELECT id, email, password_hash, role, status
       FROM users
       WHERE LOWER(TRIM(email)) = $1
         AND role IN ('admin', 'sub_admin')`,
      [email.toLowerCase().trim()]
    );

    const user = rows[0];

    if (!user) {
      return fail(res, 'Invalid email or password', 401);
    }

    if (user.status === 'suspended' || user.status === 'deactivated') {
      return fail(res, 'This account has been deactivated. Contact support.', 403);
    }

    // Trim the stored hash — guards against whitespace from manual SQL inserts
    const storedHash = (user.password_hash || '').trim();
    if (!storedHash) {
      return fail(res, 'Invalid email or password', 401);
    }

    const match = await bcrypt.compare(password, storedHash);
    if (!match) {
      return fail(res, 'Invalid email or password', 401);
    }

    // Admin accounts are created manually — no email_verified gate

    await db.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    // Fetch display name from admin_profiles (may not exist for legacy accounts)
    const profileRes = await db.query(
      `SELECT first_name, last_name FROM admin_profiles WHERE user_id = $1`,
      [user.id]
    );
    const p = profileRes.rows[0];
    const displayName = p
      ? [p.first_name, p.last_name].filter(Boolean).join(' ') || user.email
      : user.email;

    const accessToken  = signAccess({ id: user.id, role: user.role });
    const refreshToken = signRefresh({ id: user.id });
    await storeRefreshToken(user.id, refreshToken, req);

    return ok(res, {
      user: {
        id:           user.id,
        email:        user.email,
        role:         user.role,
        display_name: displayName,
        avatar_url:   null,
      },
      access_token:  accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, verifyEmail, resendCode, login, adminLogin, refresh, logout, forgotPassword, resetPassword, me };
