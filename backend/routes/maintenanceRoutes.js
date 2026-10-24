const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.get('/', checkPermission('view_maintenances'), maintenanceController.index);
router.get('/create', checkPermission('create_maintenance'), maintenanceController.create);
router.post('/', checkPermission('create_maintenance'), maintenanceController.store);
router.get('/:id', checkPermission('view_maintenances'), maintenanceController.show);
router.get('/:id/edit', checkPermission('edit_maintenance'), maintenanceController.edit);
router.put('/:id', checkPermission('edit_maintenance'), maintenanceController.update);
router.delete('/:id', checkPermission('delete_maintenance'), maintenanceController.destroy);

module.exports = router;