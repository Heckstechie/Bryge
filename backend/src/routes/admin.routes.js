const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const admin = require('../controllers/admin.controller');

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'sub_admin'));

// ── Overview ──────────────────────────────────────────────────────────────────
router.get('/overview', admin.getOverview);

// ── Customers ─────────────────────────────────────────────────────────────────
router.get('/customers',              admin.getCustomers);
router.get('/customers/:id',          admin.getCustomer);
router.patch('/customers/:id/status', admin.updateCustomerStatus);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications', admin.getNotifications);

// ── Refunds ───────────────────────────────────────────────────────────────────
router.get('/refunds', admin.getRefunds);

// ── Audit Log ─────────────────────────────────────────────────────────────────
router.get('/audit-log', admin.getAuditLog);

// ── Orders ────────────────────────────────────────────────────────────────────
router.get('/orders',                                        admin.getOrders);
router.get('/orders/:id',                                    admin.getOrder);
router.patch('/orders/:orderId/vendor-orders/:voId/status',  admin.updateVendorOrderStatus);

// ── Disputes — specific sub-routes before /:id ────────────────────────────────
router.get('/disputes',                     admin.getDisputes);
router.patch('/disputes/:id/review',        admin.startReview);
router.patch('/disputes/:id/note',          admin.updateDisputeNote);
router.post('/disputes/:id/resolve',        admin.resolveDispute);
router.get('/disputes/:id',                 admin.getDispute);

// ── Vendors — IMPORTANT: specific routes before /:id ─────────────────────────
router.get('/vendors/applications',         admin.getApplications);
router.get('/vendors/applications/:id',     admin.getApplication);
router.post('/vendors/:id/approve',         admin.approveVendor);
router.post('/vendors/:id/reject',          admin.rejectVendor);
router.patch('/vendors/:id/status',         admin.updateVendorStatus);
router.get('/vendors',                      admin.getVendors);
router.get('/vendors/:id',                  admin.getVendor);

// ── Products ──────────────────────────────────────────────────────────────────
router.get('/products',              admin.getAdminProducts);
router.get('/products/:id',          admin.getAdminProduct);
router.patch('/products/:id/status', admin.updateProductStatus);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports/sales',        admin.getSalesAnalytics);
router.get('/reports/vendors',      admin.getVendorPerformance);
router.get('/reports/transactions', admin.getTransactions);

// ── Admin Profile ─────────────────────────────────────────────────────────────
router.get('/profile',    admin.getAdminProfile);
router.patch('/profile',  admin.updateAdminProfile);

// ── Admin Management ──────────────────────────────────────────────────────────
router.get('/admins',              admin.getAdmins);
router.post('/admins',             admin.createSubAdmin);
router.patch('/admins/:id',        admin.updateAdmin);
router.patch('/admins/:id/status', admin.toggleAdminStatus);

// ── Categories ────────────────────────────────────────────────────────────────
router.get('/categories',                  admin.getCategories);
router.post('/categories',                 admin.createCategory);
router.put('/categories/:id',              admin.updateCategory);
router.patch('/categories/:id/status',     admin.toggleCategoryStatus);

// ── Payouts ───────────────────────────────────────────────────────────────────
router.get('/payouts',                     admin.getPayouts);
router.get('/payouts/:id',                 admin.getPayout);
router.post('/payouts/:id/release',        admin.releasePayout);
router.post('/payouts/:id/complete',       admin.completePayout);

module.exports = router;
