const { Router } = require('express');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/customer.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();
const authCustomer = [authenticate, requireRole('customer')];

router.get('/profile', ...authCustomer, ctrl.getProfile);
router.patch('/profile',
  ...authCustomer,
  [
    body('first_name').optional().trim().notEmpty(),
    body('last_name').optional().trim().notEmpty(),
    body('date_of_birth').optional().isDate(),
    body('country').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
  ],
  validate,
  ctrl.updateProfile
);

router.get('/addresses', ...authCustomer, ctrl.getAddresses);
router.post('/addresses',
  ...authCustomer,
  [
    body('recipient_name').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    body('address_line1').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
    body('country').trim().notEmpty(),
    body('postal_code').optional().trim(),
    body('label').optional().trim(),
    body('is_default').optional().isBoolean(),
  ],
  validate,
  ctrl.createAddress
);
router.patch('/addresses/:id',
  ...authCustomer,
  [
    param('id').isUUID(),
    body('recipient_name').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('address_line1').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('state').optional().trim().notEmpty(),
    body('country').optional().trim().notEmpty(),
    body('postal_code').optional().trim(),
    body('label').optional().trim(),
    body('is_default').optional().isBoolean(),
  ],
  validate,
  ctrl.updateAddress
);
router.delete('/addresses/:id', ...authCustomer, [param('id').isUUID()], validate, ctrl.deleteAddress);

router.get('/notifications', ...authCustomer, ctrl.getNotifications);
router.patch('/notifications/read', ...authCustomer, ctrl.markNotificationsRead);

router.get('/reviews', ...authCustomer, ctrl.getReviews);
router.post('/reviews',
  ...authCustomer,
  [
    body('order_item_id').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('title').optional().trim(),
    body('body').optional().trim(),
  ],
  validate,
  ctrl.createReview
);

module.exports = router;
