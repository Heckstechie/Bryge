const { Router } = require('express');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/site.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = Router();

// Public: get active banner
router.get('/banner', ctrl.getActiveBanner);

// Admin routes (require admin role) — image upload via single file field 'image'
router.post('/banner', authenticate, requireRole('admin'), upload.single('image'), ctrl.createBanner);
router.get('/banners', authenticate, requireRole('admin'), ctrl.listBanners);
router.patch('/banner/:id/activate', authenticate, requireRole('admin'), ctrl.activateBanner);

module.exports = router;
