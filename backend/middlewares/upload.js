// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 1. Configurar Cloudinary con las variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Filtro de imágenes
function imageFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp|svg|ico/; // Agregué 'ico' por si subes un favicon
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp, svg, ico)'));
  }
}

// 3. Función para crear el almacenamiento en Cloudinary según la carpeta
function createCloudinaryStorage(folder) {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `erp_jpsecurity/${folder}`,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'svg', 'ico'],
      transformation: [{ width: 1000, crop: 'limit' }] 
    }
  });
}

// ============================================================
// UPLOADS ESPECÍFICOS
// ============================================================

// Logo de marcas
const uploadBrandLogo = multer({
  storage: createCloudinaryStorage('brands'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
}).single('logo');

// Imagen de productos
const uploadProductImage = multer({
  storage: createCloudinaryStorage('products'),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter
}).single('image');

// Logo de empresa
const uploadCompanyLogo = multer({
  storage: createCloudinaryStorage('company'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
}).single('logo');

// Imágenes de los slides del hero
const uploadSlideImages = multer({
  storage: createCloudinaryStorage('slides'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
}).fields([
  { name: 'slideImage0', maxCount: 1 },
  { name: 'slideImage1', maxCount: 1 },
  { name: 'slideImage2', maxCount: 1 }
]);

// ============================================================
// SETTINGS (Logo + Favicon + Slides)
// ============================================================

const settingsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'erp_jpsecurity/settings',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'svg', 'ico'],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${file.fieldname}-${uniqueSuffix}`;
    }
  }
});

const uploadSettingsCloud = multer({
  storage: settingsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
  uploadSettings: uploadSettingsCloud // Exportamos directamente la configuración en la nube
};