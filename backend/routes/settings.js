const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { auth } = require('../middlewares/auth');
const { uploadSettings } = require('../middlewares/upload');

// ============================================
// Página de configuración (solo usuarios autenticados)
// ============================================
router.get('/settings', auth, settingController.getSettings);

// ✅ POST con upload de archivos (logo, favicon, slides)
router.post(
  '/settings',
  auth,
  uploadSettings,
  settingController.updateSettings
);

// ============================================
// API pública — la landing la consume sin auth
// ============================================
router.get('/api/settings', settingController.getSettingsJSON);

module.exports = router;