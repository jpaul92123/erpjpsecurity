const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

// ============================================================
// Todas las rutas requieren autenticación
// ============================================================
router.use(auth);

// ============================================================
// 1️⃣ RUTAS ESPECÍFICAS (van primero)
// ============================================================

// Listado
router.get('/', checkPermission('view_orders'), orderController.index);

// Crear (formulario) — ⚠️ antes de /:id
router.get('/create', checkPermission('create_order'), orderController.create);

// Crear (POST)
router.post('/', checkPermission('create_order'), orderController.store);

// ============================================================
// 2️⃣ RUTAS CON :id Y SUFIJO ESPECÍFICO
// ============================================================

// Editar — ⚠️ antes de /:id
router.get('/:id/edit', checkPermission('edit_order'), orderController.edit);

// Actualizar
router.put('/:id', checkPermission('edit_order'), orderController.update);

// Eliminar
router.delete('/:id', checkPermission('delete_order'), orderController.destroy);

// ============================================================
// 3️⃣ DETALLE (SIEMPRE AL FINAL)
// ⚠️ Atrapa cualquier :id
// ============================================================

router.get('/:id', checkPermission('view_orders'), orderController.show);

module.exports = router;