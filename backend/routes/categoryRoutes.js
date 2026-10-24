const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

// ============================================================
// Todas las rutas requieren login
// ============================================================
router.use(auth);

// ============================================================
// 1️⃣ RUTAS ESPECÍFICAS (van primero)
// ⚠️ Siempre antes de cualquier /:id
// ============================================================

// Listado principal
router.get('/', checkPermission('view_categories'), categoryController.index);

// Crear categoría (⚠️ antes de /:id)
router.get('/create', checkPermission('create_category'), categoryController.create);

// Obtener categorías padre (API para dropdowns)
router.get('/parents', checkPermission('view_categories'), categoryController.getParents);

// Crear subcategoría (ruta específica con :parentId)
router.get('/:parentId/subcategories/create', checkPermission('create_category'), categoryController.createSubcategory);

// Editar categoría (⚠️ antes de /:id)
router.get('/:id/edit', checkPermission('edit_category'), categoryController.edit);

// ============================================================
// 2️⃣ RUTAS POST / PUT / DELETE
// ============================================================

// Crear (POST)
router.post('/', checkPermission('create_category'), categoryController.store);

// Actualizar (PUT)
router.put('/:id', checkPermission('edit_category'), categoryController.update);

// Eliminar (DELETE)
router.delete('/:id', checkPermission('delete_category'), categoryController.destroy);

// ============================================================
// 3️⃣ RUTAS GENÉRICAS (SIEMPRE al final)
// ⚠️ Si más adelante agregás una ruta /:id para detalle,
//    va aquí abajo, después de TODAS las específicas
// ============================================================

// Si en algún momento agregás detalle de categoría:
// router.get('/:id', checkPermission('view_categories'), categoryController.detail);

module.exports = router;