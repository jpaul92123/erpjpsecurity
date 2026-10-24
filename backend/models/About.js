const mongoose = require('mongoose');

// ============================================
// SUB-ESQUEMA: Servicio que ofrece la empresa
// ============================================
const serviceSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  image:       { type: String, default: '' },         // URL o ruta
  icon:        { type: String, default: 'fa-tools' }, // FontAwesome
  features:    { type: [String], default: [] },       // Lista de características
  order:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true }
}, { _id: true, timestamps: true });

// ============================================
// SUB-ESQUEMA: Proyecto realizado (caso de éxito)
// ============================================
const projectSchema = new mongoose.Schema({
  client:      { type: String, required: true, trim: true },   // Nombre del cliente
  address:     { type: String, required: true, trim: true },   // Dirección
  city:        { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  images:      { type: [String], default: [] },                // Array de URLs
  serviceDate: { type: Date, default: Date.now },
  serviceType: { type: String, default: '', trim: true },      // Ej: Instalación, Mantenimiento
  order:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true }
}, { _id: true, timestamps: true });

// ============================================
// SUB-ESQUEMA: Valores de la empresa
// ============================================
const valueSchema = new mongoose.Schema({
  icon:        { type: String, default: 'fa-star' },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true }
}, { _id: true });

// ============================================
// ESQUEMA PRINCIPAL: About (singleton)
// ============================================
const aboutSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'global',
    unique: true
  },

  // 🏢 Información corporativa
  companyInfo: {
    hero: {
      title:       { type: String, default: 'Nosotros', trim: true },
      subtitle:    { type: String, default: 'Conoce más sobre nuestra empresa', trim: true },
      background:  { type: String, default: '' }   // URL de imagen de fondo
    },
    description:    { type: String, default: '', trim: true },   // Texto principal
    history:        { type: String, default: '', trim: true },   // Historia
    mission:        { type: String, default: '', trim: true },   // Misión
    vision:         { type: String, default: '', trim: true },   // Visión
    yearsExperience:{ type: Number, default: 0 },
    clientsCount:   { type: Number, default: 0 },
    projectsCount:  { type: Number, default: 0 },
    values:         { type: [valueSchema], default: [] }
  },

  // 🛠️ Servicios que ofrecemos
  services: { type: [serviceSchema], default: [] },

  // 🏗️ Proyectos realizados (historial)
  projects: { type: [projectSchema], default: [] }

}, { timestamps: true });

// ============================================
// MÉTODO ESTÁTICO: Obtener o crear la config
// ============================================
aboutSchema.statics.getGlobal = async function () {
  let about = await this.findOne({ key: 'global' });
  if (!about) {
    about = await this.create({ key: 'global' });
  }
  return about;
};

module.exports = mongoose.model('About', aboutSchema);