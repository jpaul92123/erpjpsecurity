// ============================================================
// routes/clients.js
// ============================================================
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
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
router.get('/', checkPermission('view_clients'), clientController.index);

// Formulario de creación
router.get('/create', checkPermission('create_client'), clientController.create);

// Guardar nuevo cliente
router.post('/', checkPermission('create_client'), clientController.store);

// API: Buscar clientes (autocompletar en ventas/cotizaciones)
router.get('/search', checkPermission('view_clients'), clientController.searchClients);

// ============================================================
// 2️⃣ RUTAS CON :id Y SUFIJO ESPECÍFICO
// ⚠️ Van ANTES de GET /:id
// ============================================================

// Formulario de edición
router.get('/:id/edit', checkPermission('edit_client'), clientController.edit);

// API: Obtener datos de cliente en JSON (para AJAX)
router.get('/:id/data', checkPermission('view_clients'), clientController.getClientData);

// Actualizar cliente
router.put('/:id', checkPermission('edit_client'), clientController.update);

// Eliminar cliente
router.delete('/:id', checkPermission('delete_client'), clientController.destroy);

// ============================================================
// 3️⃣ RUTAS ANIDADAS DE CONTACTOS
// ⚠️ Van ANTES de GET /:id
// ============================================================

router.post('/:id/contacts', checkPermission('edit_client'), clientController.storeContact);
router.delete('/:id/contacts/:contactId', checkPermission('edit_client'), clientController.destroyContact);

// ============================================================
// 4️⃣ RUTAS ANIDADAS DE DIRECCIONES
// ⚠️ Van ANTES de GET /:id
// ============================================================

router.post('/:id/addresses', checkPermission('edit_client'), clientController.storeAddress);
router.delete('/:id/addresses/:addressId', checkPermission('edit_client'), clientController.destroyAddress);

// ============================================================
// 5️⃣ DETALLE DEL CLIENTE (SIEMPRE AL FINAL)
// ⚠️ Atrapa cualquier :id
// ============================================================

router.get('/:id', checkPermission('view_clients'), clientController.show);

module.exports = router;