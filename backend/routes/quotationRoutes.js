const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

// ============================================================
// Todas las rutas requieren autenticación
// ============================================================
router.use(auth);

// ============================================================
// 1️⃣ RUTAS API (específicas — van primero)
// ⚠️ Deben ir antes de /:id para no colisionar
// ============================================================

router.get('/api/test', quotationController.testApi);
router.get('/api/products/search', quotationController.searchProducts);
router.post('/api/client', quotationController.createClient);
router.post('/api/product', quotationController.createProduct);

// ============================================================
// 2️⃣ RUTAS CRUD ESPECÍFICAS (van primero)
// ============================================================

// Listado
router.get('/', checkPermission('view_quotations'), quotationController.index);

// Crear (formulario) — ⚠️ antes de /:id
router.get('/create', checkPermission('create_quotation'), quotationController.create);

// Crear (POST)
router.post('/', checkPermission('create_quotation'), quotationController.store);

// ============================================================
// 3️⃣ RUTAS CON :id Y SUFIJO ESPECÍFICO
// ⚠️ Van antes de GET /:id
// ============================================================

// Editar
router.get('/:id/edit', checkPermission('edit_quotation'), quotationController.edit);

// Actualizar
router.put('/:id', checkPermission('edit_quotation'), quotationController.update);

// Eliminar
router.delete('/:id', checkPermission('delete_quotation'), quotationController.destroy);

// Crear venta desde cotización
router.post('/:id/sale', checkPermission('create_sale'), quotationController.createSaleFromQuotation);

// ============================================================
// 4️⃣ DETALLE (SIEMPRE AL FINAL)
// ⚠️ Atrapa cualquier :id
// ============================================================

router.get('/:id', checkPermission('view_quotations'), quotationController.show);

module.exports = router;