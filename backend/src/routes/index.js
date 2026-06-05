const { Router } = require('express');
const authRoutes     = require('./auth.routes');
const vendorRoutes   = require('./vendor.routes');
const productRoutes  = require('./product.routes');
const categoryRoutes = require('./category.routes');
const cartRoutes     = require('./cart.routes');
const orderRoutes    = require('./order.routes');
const adminRoutes    = require('./admin.routes');
const siteRoutes     = require('./site.routes');

const router = Router();

router.use('/auth',       authRoutes);
router.use('/vendor',     vendorRoutes);
router.use('/products',   productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart',       cartRoutes);
router.use('/orders',     orderRoutes);
router.use('/admin',      adminRoutes);
router.use('/site',       siteRoutes);

module.exports = router;
