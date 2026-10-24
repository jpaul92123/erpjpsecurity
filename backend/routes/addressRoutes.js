const express = require('express');
const router = express.Router({ mergeParams: true });
const addressController = require('../controllers/addressController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

router.post('/', checkPermission('edit_client'), addressController.store);
router.delete('/:addressId', checkPermission('edit_client'), addressController.destroy);

module.exports = router;