// routes/brands.js
const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { uploadBrandLogo } = require('../middlewares/upload');
const { auth } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/rbac');

router.use(auth);

// Listado
router.get('/', checkPermission('view_brands'), brandController.index);

// Crear (formulario)
router.get('/create', checkPermission('create_brand'), brandController.create);

// Guardar (✅ CON MULTER para subir logo)
router.post(
  '/',
  checkPermission('create_brand'),
  uploadBrandLogo,
  brandController.store
);

// Editar (formulario)
router.get('/:id/edit', checkPermission('edit_brand'), brandController.edit);

// Actualizar (✅ CON MULTER)
router.put(
  '/:id',
  checkPermission('edit_brand'),
  uploadBrandLogo,
  brandController.update
);

// Eliminar
router.delete('/:id', checkPermission('delete_brand'), brandController.destroy);

// Detalle (al final)
router.get('/:id', checkPermission('view_brands'), brandController.show);

module.exports = router;