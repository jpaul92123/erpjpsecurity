const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.get('/', checkPermission('view_projects'), projectController.index);
router.get('/create', checkPermission('create_project'), projectController.create);
router.post('/', checkPermission('create_project'), projectController.store);
router.get('/:id', checkPermission('view_projects'), projectController.show);
router.get('/:id/edit', checkPermission('edit_project'), projectController.edit);
router.put('/:id', checkPermission('edit_project'), projectController.update);
router.delete('/:id', checkPermission('delete_project'), projectController.destroy);

module.exports = router;