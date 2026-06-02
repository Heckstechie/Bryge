const { Router } = require('express');
const { body, param } = require('express-validator');
const ctrl     = require('../controllers/order.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router       = Router();
const authCustomer = [authenticate, requireRole('customer')];

router.post('/',
  ...authCustomer,
  [
    body('shipping_address').isObject().withMessage('Shipping address is required'),
    body('shipping_address.first_name').notEmpty(),
    body('shipping_address.last_name').notEmpty(),
    body('shipping_address.address_line1').notEmpty(),
    body('shipping_address.city').notEmpty(),
    body('shipping_address.country').notEmpty(),
    body('shipping_address.phone').notEmpty(),
    body('payment_method').optional().isIn(['paystack', 'stripe']),
  ],
  validate, ctrl.createOrder
);

router.get('/',    ...authCustomer, ctrl.getOrders);
router.get('/:id', ...authCustomer, [param('id').isUUID()], validate, ctrl.getOrder);

module.exports = router;
