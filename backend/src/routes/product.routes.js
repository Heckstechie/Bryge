const { Router }  = require('express');
const { body, query, param } = require('express-validator');
const ctrl        = require('../controllers/product.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { upload }  = require('../middleware/upload');
const validate    = require('../middleware/validate');

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────

router.get('/', ctrl.listProducts);
router.get('/:id', [param('id').isUUID()], validate, ctrl.getProduct);

// ── Vendor-only routes ────────────────────────────────────────────────────────

const vendorAuth = [authenticate, requireRole('vendor')];

router.get('/vendor/mine', ...vendorAuth, ctrl.vendorProducts);
router.get('/vendor/mine/:id', ...vendorAuth, [param('id').isUUID()], validate, ctrl.vendorGetProduct);

router.post('/',
  ...vendorAuth,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('category_id').isUUID().withMessage('Valid category is required'),
    body('price').isNumeric().isFloat({ min: 1 }).withMessage('Price must be a positive number'),
    body('stock_quantity').optional().isInt({ min: 0 }),
    body('description').optional().trim(),
    body('weight_kg').optional().isFloat({ min: 0 }),
  ],
  validate,
  ctrl.createProduct
);

router.put('/:id',
  ...vendorAuth,
  [
    param('id').isUUID(),
    body('price').optional().isNumeric().isFloat({ min: 1 }),
    body('stock_quantity').optional().isInt({ min: 0 }),
  ],
  validate,
  ctrl.updateProduct
);

router.patch('/:id/toggle', ...vendorAuth, [param('id').isUUID()], validate, ctrl.toggleStatus);

router.delete('/:id', ...vendorAuth, [param('id').isUUID()], validate, ctrl.deleteProduct);

router.post('/:id/images',
  ...vendorAuth,
  upload.array('images', 5),
  ctrl.uploadImages
);

router.delete('/:id/images/:imageId',
  ...vendorAuth,
  [param('id').isUUID(), param('imageId').isUUID()],
  validate,
  ctrl.deleteImage
);

module.exports = router;
