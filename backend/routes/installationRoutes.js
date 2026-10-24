const express = require('express');
const router = express.Router();
const installationController = require('../controllers/installationController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.get('/', checkPermission('view_installations'), installationController.index);
router.get('/create', checkPermission('create_installation'), installationController.create);
router.post('/', checkPermission('create_installation'), installationController.store);
router.get('/:id', checkPermission('view_installations'), installationController.show);
router.get('/:id/edit', checkPermission('edit_installation'), installationController.edit);
router.put('/:id', checkPermission('edit_installation'), installationController.update);
router.delete('/:id', checkPermission('delete_installation'), installationController.destroy);

module.exports = router;