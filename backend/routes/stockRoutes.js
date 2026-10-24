const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.get('/entries', checkPermission('view_stock'), stockController.entries);
router.post('/entries', checkPermission('create_stock'), stockController.storeEntry);
router.get('/exits', checkPermission('view_stock'), stockController.exits);
router.post('/exits', checkPermission('create_stock'), stockController.storeExit);

module.exports = router;