const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.get('/', checkPermission('view_visits'), visitController.index);
router.get('/create', checkPermission('create_visit'), visitController.create);
router.post('/', checkPermission('create_visit'), visitController.store);
router.get('/:id', checkPermission('view_visits'), visitController.show);
router.get('/:id/edit', checkPermission('edit_visit'), visitController.edit);
router.put('/:id', checkPermission('edit_visit'), visitController.update);
router.delete('/:id', checkPermission('delete_visit'), visitController.destroy);

module.exports = router;