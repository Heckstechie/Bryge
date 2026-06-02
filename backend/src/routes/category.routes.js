const { Router } = require('express');
const ctrl = require('../controllers/category.controller');
const router = Router();

router.get('/',           ctrl.getAll);
router.get('/with-counts', ctrl.getWithCounts);

module.exports = router;
