// ============================================================
// models/Supplier.js
// ============================================================
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  // ==========================================
  // DATOS PRINCIPALES
  // ==========================================
  businessName: {
    type: String,
    required: [true, 'El nombre o razón social es obligatorio'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres']
  },
  ruc: {
    type: String,
    required: [true, 'El RUC es obligatorio'],
    unique: true,
    trim: true,
    maxlength: [11, 'El RUC no puede exceder 11 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  contactPerson: {
    type: String,
    trim: true,
    default: ''
  },

  // ==========================================
  // ESTADO
  // ==========================================
  isActive: {
    type: Boolean,
    default: true
  },

  // ==========================================
  // AUDITORÍA
  // ==========================================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// ÍNDICES
// ============================================================
supplierSchema.index({ businessName: 1 });
supplierSchema.index({ ruc: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ businessName: 'text', ruc: 'text', email: 'text' });

// ============================================================
// VIRTUALS
// ============================================================

// Inicial del nombre (para avatares)
supplierSchema.virtual('initial').get(function() {
  if (!this.businessName) return '?';
  return this.businessName.charAt(0).toUpperCase();
});

// ============================================================
// MÉTODOS
// ============================================================

// Verificar si tiene productos asociados
supplierSchema.methods.hasProducts = async function() {
  const Product = mongoose.model('Product');
  const hasProducts = await Product.exists({ supplier: this._id });
  return !!hasProducts;
};

// Contar productos asociados
supplierSchema.methods.getProductsCount = async function() {
  const Product = mongoose.model('Product');
  return await Product.countDocuments({ supplier: this._id });
};

// ============================================================
// EXPORTAR
// ============================================================
module.exports = mongoose.model('Supplier', supplierSchema);