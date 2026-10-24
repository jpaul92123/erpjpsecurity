const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

// ============================================================
// 1️⃣ RUTAS PÚBLICAS ESPECÍFICAS (van primero)
// ============================================================

// Búsqueda en vivo
router.get('/search', productController.searchProducts);

// Subcategorías por categoría (dropdown público)
router.get('/subcategories/:categoryId', productController.getSubcategories);

// ============================================================
// 2️⃣ RUTAS PROTEGIDAS ESPECÍFICAS
// ⚠️ Deben ir ANTES de /:id
// ============================================================

// Crear producto (⚠️ antes de /:id)
router.get('/create', auth, checkPermission('create_product'), productController.create);

// Editar producto (⚠️ antes de /:id)
router.get('/:id/edit', auth, checkPermission('edit_product'), productController.edit);

// Descargar catálogo
router.get('/catalog/download', auth, productController.downloadCatalog);

// ============================================================
// 3️⃣ RUTAS PÚBLICAS GENÉRICAS
// ============================================================

// Listado de productos
router.get('/', productController.index);

// Detalle del producto (⚠️ SIEMPRE AL FINAL — atrapa cualquier :id)
router.get('/:id', productController.detail);

// ============================================================
// 4️⃣ RUTAS POST / PUT / DELETE
// ============================================================

// Crear (POST)
router.post('/', auth, checkPermission('create_product'), productController.store);

// Actualizar (PUT)
router.put('/:id', auth, checkPermission('edit_product'), productController.update);

// Eliminar (DELETE)
router.delete('/:id', auth, checkPermission('delete_product'), productController.destroy);

module.exports = router;