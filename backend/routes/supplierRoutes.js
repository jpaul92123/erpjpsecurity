// ============================================================
// routes/suppliers.js
// ============================================================
const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

// ============================================================
// Todas las rutas requieren autenticación
// ============================================================
router.use(auth);

// ============================================================
// 1️⃣ RUTAS ESPECÍFICAS (van primero)
// ⚠️ Van ANTES de /:id
// ============================================================

// Listado
router.get('/', checkPermission('view_suppliers'), supplierController.index);

// Formulario de creación
router.get('/create', checkPermission('create_supplier'), supplierController.create);

// Guardar nuevo proveedor
router.post('/', checkPermission('create_supplier'), supplierController.store);

// API: Buscar proveedores (autocompletar)
router.get('/search', checkPermission('view_suppliers'), supplierController.searchSuppliers);

// ============================================================
// 2️⃣ RUTAS CON :id Y SUFIJO ESPECÍFICO
// ⚠️ Van ANTES de GET /:id
// ============================================================

// Formulario de edición
router.get('/:id/edit', checkPermission('edit_supplier'), supplierController.edit);

// API: Obtener datos de proveedor (AJAX)
router.get('/:id/data', checkPermission('view_suppliers'), supplierController.getSupplierData);

// Actualizar
router.put('/:id', checkPermission('edit_supplier'), supplierController.update);

// Eliminar
router.delete('/:id', checkPermission('delete_supplier'), supplierController.destroy);

// ============================================================
// 3️⃣ DETALLE DEL PROVEEDOR (SIEMPRE AL FINAL)
// ⚠️ Atrapa cualquier :id
// ============================================================

router.get('/:id', checkPermission('view_suppliers'), supplierController.show);

module.exports = router;