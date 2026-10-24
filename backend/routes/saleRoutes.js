const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
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
router.get('/', checkPermission('view_sales'), saleController.index);

// Crear (formulario) — ⚠️ antes de /:id
router.get('/create', checkPermission('create_sale'), saleController.create);

// Crear (POST)
router.post('/', checkPermission('create_sale'), saleController.store);

// ============================================================
// 2️⃣ RUTAS CON :id Y SUFIJO ESPECÍFICO
// ⚠️ Van antes de GET /:id
// ============================================================

// Editar
router.get('/:id/edit', checkPermission('edit_sale'), saleController.edit);

// Actualizar
router.put('/:id', checkPermission('edit_sale'), saleController.update);

// Eliminar
router.delete('/:id', checkPermission('delete_sale'), saleController.destroy);

// (Si agregás impresión, va aquí)
// router.get('/:id/print', checkPermission('view_sales'), saleController.print);

// ============================================================
// 3️⃣ DETALLE (SIEMPRE AL FINAL)
// ⚠️ Atrapa cualquier :id
// ============================================================

router.get('/:id', checkPermission('view_sales'), saleController.show);

module.exports = router;