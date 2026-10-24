const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.get('/', checkPermission('view_vouchers'), voucherController.index);
router.get('/create', checkPermission('create_voucher'), voucherController.create);
router.post('/', checkPermission('create_voucher'), voucherController.store);
router.get('/:id', checkPermission('view_vouchers'), voucherController.show);
router.delete('/:id', checkPermission('delete_voucher'), voucherController.destroy);
router.post('/:id/annul', checkPermission('edit_voucher'), voucherController.annul);

module.exports = router;