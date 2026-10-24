// ============================================================
// routes/index.js
// ============================================================
const express = require('express');
const router = express.Router();

// ==================== API GENERAL ====================
const apiRoutes = require('./apiRoutes');

// ==================== CHECKOUT PÚBLICO ====================
const checkoutRoutes = require('./checkoutRoutes');

// ==================== ADMIN DE PEDIDOS PÚBLICOS ====================
const orderAdminRoutes = require('./orderAdminRoutes');

// ==================== CONFIGURACIÓN ====================
const settingsRouter = require('./settings');

// ==================== AUTENTICACIÓN Y SEGURIDAD ====================
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');

// ==================== CLIENTES ====================
const clientRoutes = require('./clientRoutes');
const contactRoutes = require('./contactRoutes');
const addressRoutes = require('./addressRoutes');

// ==================== INVENTARIO ====================
const categoryRoutes = require('./categoryRoutes');
const brandRoutes = require('./brandRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const productRoutes = require('./productRoutes');
const stockRoutes = require('./stockRoutes');

// ==================== VENTAS ====================
const quotationRoutes = require('./quotationRoutes');
const orderRoutes = require('./orderRoutes');
const saleRoutes = require('./saleRoutes');
const voucherRoutes = require('./voucherRoutes');

// ==================== SERVICIOS ====================
const installationRoutes = require('./installationRoutes');
const maintenanceRoutes = require('./maintenanceRoutes');
const visitRoutes = require('./visitRoutes');
const workOrderRoutes = require('./workOrderRoutes');

// ==================== PROYECTOS ====================
const projectRoutes = require('./projectRoutes');

// ==================== COMPRAS ====================
const supplierRoutes = require('./supplierRoutes');

// ==================== NOSOTROS ====================
const aboutRoutes = require('./aboutRoutes');


// ================================================================
//                      RUTAS PRINCIPALES
// ================================================================

// 🔔 API general (notificaciones, búsquedas, etc.)
router.use('/api', apiRoutes);

// Autenticación (login, register, logout)
router.use('/', authRoutes);

// 🛒 Checkout público (crear pedido desde la tienda)
router.use('/checkout', checkoutRoutes);

// 📦 ADMIN: Gestión de pedidos públicos (listar, ver, cambiar estado, eliminar)
router.use('/orders', orderAdminRoutes);

// ⚙️ Configuración global (settings + api/settings)
router.use('/', settingsRouter);

// Seguridad (Usuarios)
router.use('/users', userRoutes);

// Clientes (con contactos y direcciones anidadas)
router.use('/clients', clientRoutes);
router.use('/clients/:clientId/contacts', contactRoutes);
router.use('/clients/:clientId/addresses', addressRoutes);

// Inventario
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/products', productRoutes);
router.use('/stock', stockRoutes);

// Ventas
router.use('/quotations', quotationRoutes);
router.use('/sales', saleRoutes);
router.use('/vouchers', voucherRoutes);

// Servicios
router.use('/installations', installationRoutes);
router.use('/maintenances', maintenanceRoutes);
router.use('/visits', visitRoutes);
router.use('/work-orders', workOrderRoutes);

// Proyectos
router.use('/projects', projectRoutes);

// Compras
router.use('/suppliers', supplierRoutes);

// Nosotros
router.use('/about', aboutRoutes);

module.exports = router;