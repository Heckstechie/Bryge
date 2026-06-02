const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate   = require('../middleware/validate');

const router = Router();

const passwordRules = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number');

router.post('/register',
  [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    passwordRules,
    body('password_confirm').custom((val, { req }) => {
      if (val !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
    body('role').optional().isIn(['customer', 'vendor']),
    // Vendor-specific fields (optional — validated in controller)
    body('business_name').optional().trim(),
    body('business_email').optional().isEmail().normalizeEmail(),
    body('business_phone').optional().trim(),
    body('business_address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('country').optional().trim(),
    body('registration_number').optional().trim(),
  ],
  validate,
  ctrl.register
);

router.post('/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Enter the 6-digit code'),
  ],
  validate,
  ctrl.verifyEmail
);

router.post('/resend-code',
  [body('email').isEmail().normalizeEmail()],
  validate,
  ctrl.resendCode
);

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

// ── Admin login — dedicated endpoint, no normalizeEmail(), role-gated ─────────
router.post('/admin/login',
  [
    body('email').isEmail().trim().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.adminLogin
);

router.post('/refresh',
  [body('refresh_token').notEmpty()],
  validate,
  ctrl.refresh
);

router.post('/logout', ctrl.logout);

router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  ctrl.forgotPassword
);

router.post('/reset-password',
  [
    body('token').notEmpty(),
    passwordRules,
    body('password_confirm').custom((val, { req }) => {
      if (val !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
  ],
  validate,
  ctrl.resetPassword
);

router.get('/me', authenticate, ctrl.me);

module.exports = router;
