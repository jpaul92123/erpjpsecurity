// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpeta si no existe
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('📁 Carpeta creada:', dir);
  }
}

// Storage configurable
function createStorage(folder) {
  const uploadPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'uploads', folder);
  ensureDir(uploadPath);

  return multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${folder}-${uniqueSuffix}${ext}`);
    }
  });
}

// Filtro de imágenes
function imageFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp, svg)'));
  }
}

// ============================================================
// UPLOADS ESPECÍFICOS
// ============================================================

// Logo de marcas
const uploadBrandLogo = multer({
  storage: createStorage('brands'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
}).single('logo');

// Imagen de productos
const uploadProductImage = multer({
  storage: createStorage('products'),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter
}).single('image');

// Logo de empresa
const uploadCompanyLogo = multer({
  storage: createStorage('company'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
}).single('logo');

// ✅ NUEVO: Imágenes de los slides del hero (hasta 3)
const uploadSlideImages = multer({
  storage: createStorage('slides'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por imagen
  fileFilter: imageFilter
}).fields([
  { name: 'slideImage0', maxCount: 1 },
  { name: 'slideImage1', maxCount: 1 },
  { name: 'slideImage2', maxCount: 1 }
]);

// ✅ NUEVO: Upload completo de settings (logo + favicon + slides)
const uploadSettings = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      // Determinar carpeta según el campo
      let folder = 'settings';
      if (file.fieldname === 'logo') folder = 'company';
      else if (file.fieldname === 'favicon') folder = 'company';
      else if (file.fieldname.startsWith('slideImage')) folder = 'slides';

      const uploadPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'uploads', folder);
      ensureDir(uploadPath);
      cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      const prefix = file.fieldname.startsWith('slideImage') ? 'slide' : file.fieldname;
      cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
  { name: 'slideImage0', maxCount: 1 },
  { name: 'slideImage1', maxCount: 1 },
  { name: 'slideImage2', maxCount: 1 }
]);

module.exports = {
  uploadBrandLogo,
  uploadProductImage,
  uploadCompanyLogo,
  uploadSlideImages,
  uploadSettings
};