// backend/routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const PublicOrder = require('../models/PublicOrder');
const { auth } = require('../middlewares/auth');

// ============================================
// Middleware específico para APIs
// Devuelve JSON en vez de redirigir al login
// ============================================
function authApi(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: 'No autenticado',
    redirect: '/login'
  });
}

// ============================================
// GET /api/notifications → Notificaciones del sistema
// ============================================
router.get('/notifications', authApi, async (req, res) => {
  try {
    const pendingOrders = await PublicOrder.find({ status: 'pendiente' })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const pendingOrdersCount = await PublicOrder.countDocuments({ status: 'pendiente' });

    // Ventas del día
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySales = await PublicOrder.aggregate([
      { $match: { createdAt: { $gte: todayStart }, status: { $ne: 'cancelado' } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]).then(r => r[0] || { total: 0, count: 0 });

    res.json({
      success: true,
      pendingOrdersCount,
      pendingOrders: pendingOrders.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        customerName: o.customer.name,
        customerPhone: o.customer.phone,
        total: o.total,
        createdAt: o.createdAt,
        itemsCount: o.items.length
      })),
      todaySalesTotal: todaySales.total,
      todaySalesCount: todaySales.count
    });
  } catch (error) {
    console.error('Error en notificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;