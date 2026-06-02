const { Router } = require('express');
const { body, query } = require('express-validator');
const ctrl     = require('../controllers/vendor.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { docUpload } = require('../middleware/upload');

const router = Router();

// All vendor routes require authentication and vendor role
router.use(authenticate, requireRole('vendor'));

router.get('/banks', ctrl.getBanks);

router.get('/resolve-account',
  [
    query('account_number').isLength({ min: 10, max: 10 }).isNumeric().withMessage('Enter a valid 10-digit account number'),
    query('bank_code').notEmpty().withMessage('Bank code is required'),
  ],
  validate,
  ctrl.resolveAccount
);

router.post('/bank-details',
  [
    body('bank_name').notEmpty().withMessage('Bank name is required'),
    body('bank_code').notEmpty().withMessage('Bank code is required'),
    body('account_number').isLength({ min: 10, max: 10 }).isNumeric().withMessage('Enter a valid 10-digit account number'),
    body('account_name').notEmpty().withMessage('Account name is required'),
  ],
  validate,
  ctrl.saveBankDetails
);

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/orders',              ctrl.getVendorOrders);
router.patch('/orders/:id/status', ctrl.updateVendorOrderStatus);

// ── Onboarding activation submission (multipart: files + JSON data field) ─────
router.post('/activate', docUpload.any(), ctrl.submitActivation);

router.get('/wallet',    ctrl.getWallet);
router.post('/withdraw', ctrl.requestWithdrawal);

router.get('/transactions', ctrl.getTransactions);

router.get('/notifications',        ctrl.getVendorNotifications);
router.patch('/notifications/read', ctrl.markNotificationsRead);

// ── Onboarding profile update ─────────────────────────────────────────────────
router.patch('/profile',
  [
    body('legal_name').optional().trim(),
    body('country').optional().trim(),
    body('business_type').optional().isIn(['starter', 'registered']),
    body('industry').optional().trim(),
    body('registration_type').optional().trim(),
  ],
  validate,
  ctrl.updateOnboardingProfile
);

module.exports = router;
