const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.get('/', checkPermission('view_warehouses'), warehouseController.index);
router.get('/create', checkPermission('create_warehouse'), warehouseController.create);
router.post('/', checkPermission('create_warehouse'), warehouseController.store);
router.get('/:id/edit', checkPermission('edit_warehouse'), warehouseController.edit);
router.put('/:id', checkPermission('edit_warehouse'), warehouseController.update);
router.delete('/:id', checkPermission('delete_warehouse'), warehouseController.destroy);

module.exports = router;