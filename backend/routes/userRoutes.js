const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

// Todas las rutas requieren autenticación
router.use(auth);

router.get('/', checkPermission('view_users'), userController.index);
router.get('/create', checkPermission('create_user'), userController.create);
router.post('/', checkPermission('create_user'), userController.store);
router.get('/:id/edit', checkPermission('edit_user'), userController.edit);
router.put('/:id', checkPermission('edit_user'), userController.update);
router.delete('/:id', checkPermission('delete_user'), userController.destroy);

module.exports = router;