const express = require('express');
const router = express.Router({ mergeParams: true });
const contactController = require('../controllers/contactController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.post('/', checkPermission('edit_client'), contactController.store);
router.delete('/:contactId', checkPermission('edit_client'), contactController.destroy);

module.exports = router;