const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM || `Bryge <${process.env.GMAIL_USER}>`;
const FE   = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Shared layout wrapper ──────────────────────────────────────────────────────
function layout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Bryge</title>
</head>
<body style="margin:0;padding:0;background:#F5F1EB;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1EB;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;
                                  overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)">
        <!-- Header -->
        <tr>
          <td style="background:#1B2F5C;padding:24px 36px">
            <!-- Replace LOGO_URL with the Cloudinary URL of logo-wordmark-cream.png after upload -->
            <img src="${process.env.LOGO_URL || ''}" alt="Bryge"
                 style="height:28px;width:auto;display:${process.env.LOGO_URL ? 'block' : 'none'}" />
            <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;
                          display:${process.env.LOGO_URL ? 'none' : 'inline'}">
              Bryge
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px 28px;border-top:1px solid #F0EBE3">
            <p style="margin:0;font-size:12px;color:#A0AAB8;line-height:1.6">
              © ${new Date().getFullYear()} Bryge. All rights reserved.<br/>
              You're receiving this because you have an account on
              <a href="${FE}" style="color:#C8603A;text-decoration:none">bryge.com</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Reusable UI fragments ──────────────────────────────────────────────────────
function heading(text) {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#1B2F5C;line-height:1.2">${text}</h1>`;
}

function para(text, small = false) {
  return `<p style="margin:0 0 14px;font-size:${small ? '13' : '15'}px;color:${small ? '#8A9BB0' : '#374151'};line-height:1.6">${text}</p>`;
}

function btn(label, href, color = '#C8603A') {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0">
    <tr><td style="border-radius:10px;background:${color}">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;
                               font-weight:700;color:#fff;text-decoration:none;
                               border-radius:10px">${label}</a>
    </td></tr>
  </table>`;
}

function otpBox(code) {
  return `<div style="background:#F5F1EB;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
    <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#1B2F5C;
                 font-family:'Courier New',monospace">${code}</span>
  </div>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:10px 0;font-size:13px;color:#8A9BB0;width:40%;border-bottom:1px solid #F0EBE3">${label}</td>
    <td style="padding:10px 0;font-size:13px;font-weight:600;color:#1B2F5C;border-bottom:1px solid #F0EBE3">${value}</td>
  </tr>`;
}

function naira(n) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

// ── Core send helper ───────────────────────────────────────────────────────────
async function send({ to, subject, html }) {
  await transporter.sendMail({ from: FROM, to, subject, html });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. EMAIL VERIFICATION OTP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function sendVerificationCode(to, code) {
  await send({
    to,
    subject: 'Your Bryge verification code',
    html: layout(`
      ${heading('Verify your email')}
      ${para('Enter this code to complete your Bryge account setup. It expires in <strong>15 minutes</strong>.')}
      ${otpBox(code)}
      ${para("If you didn't create a Bryge account, you can safely ignore this email.", true)}
    `),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. PASSWORD RESET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function sendPasswordReset(to, token) {
  // Determine correct reset path — vendor resets go to /vendor/reset-password
  // Use the generic path; the frontend handles both roles from the same route.
  const link = `${FE}/reset-password?token=${token}`;
  await send({
    to,
    subject: 'Reset your Bryge password',
    html: layout(`
      ${heading('Reset your password')}
      ${para('You requested a password reset. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.')}
      ${btn('Reset Password', link, '#1B2F5C')}
      ${para("If you didn't request this, you can safely ignore this email. Your password won't change.", true)}
    `),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. ORDER CONFIRMATION (customer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function sendOrderConfirmationEmail({ email, first_name, order_number, total_ngn, items = [] }) {
  const itemRows = items.map(i =>
    infoRow(i.name, `${i.quantity} × ${naira(i.unit_price_ngn)}`)
  ).join('');

  await send({
    to: email,
    subject: `Order confirmed — ${order_number}`,
    html: layout(`
      ${heading(`Thanks for your order, ${first_name || 'there'}!`)}
      ${para('Your payment was successful and your order is now being prepared by the vendor.')}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
        ${infoRow('Order number', order_number)}
        ${itemRows}
        ${infoRow('Total', `<strong style="color:#C8603A">${naira(total_ngn)}</strong>`)}
      </table>
      ${btn('View Order', `${FE}/orders/${order_number}`, '#1B2F5C')}
      ${para('Estimated delivery is 3–7 business days. We\'ll notify you when your item ships.', true)}
    `),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. VENDOR APPROVED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function sendVendorApprovedEmail({ email, business_name }) {
  await send({
    to: email,
    subject: '🎉 Your Bryge vendor application is approved!',
    html: layout(`
      ${heading('You\'re approved!')}
      ${para(`Congratulations! <strong>${business_name}</strong> has been approved as a Bryge vendor. You can now list products and start selling to our community of diaspora shoppers.`)}
      <ul style="margin:0 0 20px;padding-left:20px;color:#374151;font-size:15px;line-height:1.8">
        <li>Complete your store profile</li>
        <li>Add your bank details to receive payouts</li>
        <li>List your first product</li>
      </ul>
      ${btn('Go to Dashboard', `${FE}/vendor/dashboard`)}
      ${para('Welcome to Bryge — we\'re excited to have you on board.', true)}
    `),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. VENDOR REJECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function sendVendorRejectedEmail({ email, business_name, reason }) {
  await send({
    to: email,
    subject: 'Update on your Bryge vendor application',
    html: layout(`
      ${heading('Application update')}
      ${para(`Thank you for applying to sell on Bryge as <strong>${business_name}</strong>.`)}
      ${para('After reviewing your application, we\'re unable to approve it at this time.')}
      ${reason ? `<div style="background:#FFF4F0;border-left:4px solid #C8603A;padding:14px 18px;
                               border-radius:0 8px 8px 0;margin:20px 0">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6"><strong>Reason:</strong> ${reason}</p>
      </div>` : ''}
      ${para('You\'re welcome to address the feedback above and reapply. If you believe this decision was made in error, please contact our support team.')}
      ${btn('Contact Support', `mailto:support@bryge.com`, '#8A9BB0')}
    `),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. DISPUTE NOTIFICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// outcome: 'release_to_vendor' | 'refund_customer'
// role:    'vendor' | 'customer'
async function sendDisputeResolvedEmail({ email, name, order_number, outcome, resolution_notes, role }) {
  const wonText    = role === 'vendor'
    ? 'The funds from this order have been released to your wallet.'
    : 'A refund has been initiated to your original payment method.';
  const outcomeLabel = outcome === 'release_to_vendor' ? 'Released to vendor' : 'Refunded to customer';
  const won = (role === 'vendor' && outcome === 'release_to_vendor') ||
              (role === 'customer' && outcome === 'refund_customer');

  await send({
    to: email,
    subject: `Dispute resolved — Order ${order_number}`,
    html: layout(`
      ${heading('Dispute resolved')}
      ${para(`Hi ${name}, the dispute raised on order <strong>${order_number}</strong> has been reviewed and resolved.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
        ${infoRow('Order', order_number)}
        ${infoRow('Outcome', outcomeLabel)}
      </table>
      ${para(won ? wonText : 'Please contact support if you have further questions.')}
      ${resolution_notes ? para(`<strong>Notes from our team:</strong> ${resolution_notes}`) : ''}
      ${btn('View Order', `${FE}/${role === 'vendor' ? 'vendor/orders' : `orders/${order_number}`}`, '#1B2F5C')}
    `),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. PAYOUT NOTIFICATIONS (vendor)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function sendPayoutProcessingEmail({ email, business_name, amount, bank_name, account_number }) {
  await send({
    to: email,
    subject: `Payout in progress — ${naira(amount)}`,
    html: layout(`
      ${heading('Your payout is on its way')}
      ${para(`Hi <strong>${business_name}</strong>, we've initiated your withdrawal request and it's now being processed.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
        ${infoRow('Amount', `<strong style="color:#3D6B4F">${naira(amount)}</strong>`)}
        ${infoRow('Destination', `${bank_name} ···${String(account_number).slice(-4)}`)}
        ${infoRow('Estimated arrival', '1–3 business days')}
      </table>
      ${btn('View Transactions', `${FE}/vendor/transactions`, '#1B2F5C')}
    `),
  });
}

async function sendPayoutCompletedEmail({ email, business_name, amount, bank_name, account_number }) {
  await send({
    to: email,
    subject: `Payout of ${naira(amount)} is complete`,
    html: layout(`
      ${heading('Payout successful!')}
      ${para(`Hi <strong>${business_name}</strong>, your withdrawal has been sent successfully.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
        ${infoRow('Amount paid', `<strong style="color:#3D6B4F">${naira(amount)}</strong>`)}
        ${infoRow('Sent to', `${bank_name} ···${String(account_number).slice(-4)}`)}
      </table>
      ${para('Funds should appear in your bank account within 1–3 business days depending on your bank.', true)}
      ${btn('View Transactions', `${FE}/vendor/transactions`, '#3D6B4F')}
    `),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports = {
  sendVerificationCode,
  sendPasswordReset,
  sendOrderConfirmationEmail,
  sendVendorApprovedEmail,
  sendVendorRejectedEmail,
  sendDisputeResolvedEmail,
  sendPayoutProcessingEmail,
  sendPayoutCompletedEmail,
};
