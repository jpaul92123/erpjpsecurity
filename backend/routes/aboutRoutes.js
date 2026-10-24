const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
const { auth } = require('../middlewares/auth');

// ============================================================
// RUTAS PÚBLICAS
// ============================================================
router.get('/', aboutController.getPublic);

// ============================================================
// RUTAS PROTEGIDAS (admin)
// ============================================================
router.get('/admin', auth, aboutController.getAdmin);

// Info empresa
router.post('/company', auth, aboutController.updateCompany);
router.post('/values', auth, aboutController.updateValues);

// Servicios
router.post('/services', auth, aboutController.createService);
router.post('/services/:id', auth, aboutController.updateService);
router.post('/services/:id/delete', auth, aboutController.deleteService);

// Proyectos
router.post('/projects', auth, aboutController.createProject);
router.post('/projects/:id', auth, aboutController.updateProject);
router.post('/projects/:id/delete', auth, aboutController.deleteProject);

module.exports = router;