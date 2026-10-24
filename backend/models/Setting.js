// ============================================================
// models/Setting.js
// ============================================================
const mongoose = require('mongoose');

// ============================================================
// SUB-ESQUEMA: Slide del Hero
// ============================================================
const slideSchema = new mongoose.Schema({
  title: {
    type: String,
    default: '',
    trim: true
  },
  subtitle: {
    type: String,
    default: '',
    trim: true
  },
  buttonText: {
    type: String,
    default: '',
    trim: true
  },
  buttonLink: {
    type: String,
    default: '',
    trim: true
  },
  // ✅ Imagen: puede ser URL externa o ruta local (/uploads/slides/...)
  image: {
    type: String,
    default: ''
  },
  bgColor: {
    type: String,
    default: '#0d6efd'
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  // Categoría vinculada al slide (opcional)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// ============================================================
// SUB-ESQUEMA: Redes Sociales
// ============================================================
const socialSchema = new mongoose.Schema({
  facebook:  { type: String, default: '' },
  instagram: { type: String, default: '' },
  whatsapp:  { type: String, default: '' },
  youtube:   { type: String, default: '' },
  tiktok:    { type: String, default: '' },
  linkedin:  { type: String, default: '' },
  twitter:   { type: String, default: '' }
}, { _id: false });

// ============================================================
// SUB-ESQUEMA: Horarios
// ============================================================
const scheduleSchema = new mongoose.Schema({
  weekdays: { type: String, default: 'Lun - Vie: 9:00 - 19:00' },
  saturday: { type: String, default: 'Sáb: 9:00 - 14:00' },
  sunday:   { type: String, default: 'Dom: Cerrado' },
  holidays: { type: String, default: '' }
}, { _id: false });

// ============================================================
// ESQUEMA PRINCIPAL
// ============================================================
const settingSchema = new mongoose.Schema({
  // 🔑 Clave única — siempre 'global' para este proyecto
  key: {
    type: String,
    default: 'global',
    unique: true
  },

  // ==========================================
  // 🏷️ IDENTIDAD DEL SITIO
  // ==========================================
  siteName: {
    type: String,
    default: 'JP Security',
    trim: true
  },
  siteTagline: {
    type: String,
    default: 'Soluciones en Seguridad Electrónica',
    trim: true
  },
  // ✅ Logo: URL externa o ruta local (/uploads/company/...)
  logo: {
    type: String,
    default: ''
  },
  // ✅ Favicon: URL externa o ruta local (/uploads/company/...)
  favicon: {
    type: String,
    default: ''
  },
  // Icono FontAwesome
  icon: {
    type: String,
    default: 'fa-shield-halved'
  },

  // ==========================================
  // 🏢 DATOS DE LA EMPRESA
  // ==========================================
  company: {
    legalName: { type: String, default: '', trim: true },
    ruc:       { type: String, default: '', trim: true },
    phone:     { type: String, default: '', trim: true },
    email:     { type: String, default: '', trim: true, lowercase: true },
    address:   { type: String, default: '', trim: true },
    city:      { type: String, default: 'Lima', trim: true },
    country:   { type: String, default: 'Perú', trim: true }
  },

  // ==========================================
  // 🕐 HORARIOS
  // ==========================================
  schedule: {
    type: scheduleSchema,
    default: () => ({})
  },

  // ==========================================
  // 🌐 REDES SOCIALES
  // ==========================================
  social: {
    type: socialSchema,
    default: () => ({})
  },

  // ==========================================
  // 🎞️ SLIDES DEL HERO (máximo 3)
  // ==========================================
  heroSlides: {
    type: [slideSchema],
    validate: {
      validator: function(arr) {
        return arr.length <= 3;
      },
      message: 'Máximo 3 slides permitidos'
    },
    default: []
  },

  // ==========================================
  // 🎨 COLORES DE MARCA
  // ==========================================
  colors: {
    primary:   { type: String, default: '#0d6efd' },
    secondary: { type: String, default: '#0a58ca' },
    accent:    { type: String, default: '#ffc107' }
  },

  // ==========================================
  // 📝 SEO
  // ==========================================
  metaDescription: {
    type: String,
    default: '',
    trim: true
  },
  metaKeywords: {
    type: String,
    default: '',
    trim: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// ÍNDICES
// ============================================================
settingSchema.index({ key: 1 });

// ============================================================
// VIRTUALS
// ============================================================

// Verificar si tiene logo
settingSchema.virtual('hasLogo').get(function() {
  return !!this.logo;
});

// Verificar si tiene slides activos
settingSchema.virtual('activeSlidesCount').get(function() {
  if (!this.heroSlides) return 0;
  return this.heroSlides.filter(s => s.isActive !== false).length;
});

// ============================================================
// MÉTODOS ESTÁTICOS
// ============================================================

// Obtener o crear la configuración global
settingSchema.statics.getGlobal = async function() {
  let setting = await this.findOne({ key: 'global' })
    .populate('heroSlides.category', 'name');

  if (!setting) {
    setting = await this.create({ key: 'global' });
    setting = await this.findById(setting._id)
      .populate('heroSlides.category', 'name');
  }

  return setting;
};

// ============================================================
// MÉTODOS DE INSTANCIA
// ============================================================

// Obtener solo los slides activos
settingSchema.methods.getActiveSlides = function() {
  if (!this.heroSlides) return [];
  return this.heroSlides.filter(s => s.isActive !== false);
};

// Verificar si tiene slides
settingSchema.methods.hasSlides = function() {
  return this.heroSlides && this.heroSlides.length > 0;
};

// ============================================================
// EXPORTAR
// ============================================================
module.exports = mongoose.model('Setting', settingSchema);