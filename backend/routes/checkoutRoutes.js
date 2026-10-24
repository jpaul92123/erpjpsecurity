const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// ============================================================
// 1️⃣ RUTAS ESPECÍFICAS (van primero)
// ============================================================

// 🆕 Seguimiento de pedido (específica, va primero)
router.get('/track', checkoutController.getTrack);
router.post('/track', checkoutController.postTrack);

// ============================================================
// 2️⃣ RUTAS CON :id + sufijo
// ============================================================

// Confirmación del pedido
router.get('/success/:id', checkoutController.getSuccess);

// ============================================================
// 3️⃣ RUTAS GENÉRICAS
// ============================================================

// Formulario de checkout
router.get('/', checkoutController.getCheckout);
router.post('/', checkoutController.postCheckout);

module.exports = router;