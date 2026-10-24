const express = require('express');
const router = express.Router();
const orderAdminController = require('../controllers/orderAdminController');
const { auth } = require('../middlewares/auth');

// Todas requieren login
router.use(auth);

// Listado
router.get('/', orderAdminController.index);

// Detalle
router.get('/:id', orderAdminController.detail);

// Cambiar estado
router.put('/:id/status', orderAdminController.updateStatus);

// Eliminar
router.delete('/:id', orderAdminController.destroy);

module.exports = router;