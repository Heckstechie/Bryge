const { Router } = require('express');
const { body, param } = require('express-validator');
const ctrl     = require('../controllers/cart.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router   = Router();
const authCustomer = [authenticate, requireRole('customer')];

router.get('/',                        ...authCustomer, ctrl.getCart);
router.post('/add',
  ...authCustomer,
  [
    body('product_id').isUUID().withMessage('Valid product_id required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be ≥ 1'),
    body('product_variant_id').optional().isUUID(),
  ],
  validate, ctrl.addToCart
);
router.put('/:itemId',
  ...authCustomer,
  [
    param('itemId').isUUID(),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be ≥ 1'),
  ],
  validate, ctrl.updateCartItem
);
router.delete('/clear',  ...authCustomer, ctrl.clearCart);
router.delete('/:itemId',...authCustomer, [param('itemId').isUUID()], validate, ctrl.removeCartItem);
router.post('/apply-coupon',
  ...authCustomer,
  [body('code').notEmpty().withMessage('Promo code required')],
  validate, ctrl.applyCoupon
);

module.exports = router;
