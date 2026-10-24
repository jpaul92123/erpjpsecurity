const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.get('/', checkPermission('view_workorders'), workOrderController.index);
router.get('/create', checkPermission('create_workorder'), workOrderController.create);
router.post('/', checkPermission('create_workorder'), workOrderController.store);
router.get('/:id', checkPermission('view_workorders'), workOrderController.show);
router.get('/:id/edit', checkPermission('edit_workorder'), workOrderController.edit);
router.put('/:id', checkPermission('edit_workorder'), workOrderController.update);
router.delete('/:id', checkPermission('delete_workorder'), workOrderController.destroy);

module.exports = router;