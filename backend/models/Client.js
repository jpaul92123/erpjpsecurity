// ============================================================
// models/Client.js
// ============================================================
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
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
    required: [true, 'El RUC o DNI es obligatorio'],
    unique: true,
    trim: true,
    maxlength: [11, 'El RUC/DNI no puede exceder 11 caracteres']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    enum: {
      values: ['Natural', 'Jurídico'],
      message: 'El tipo debe ser "Natural" o "Jurídico"'
    },
    default: 'Natural'
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
  },

  // ==========================================
  // RELACIONES
  // ==========================================
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  }],
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// ÍNDICES
// ============================================================
clientSchema.index({ businessName: 1 });
clientSchema.index({ ruc: 1 });
clientSchema.index({ isActive: 1 });
clientSchema.index({ type: 1 });
// Búsqueda por texto
clientSchema.index({ businessName: 'text', ruc: 'text', email: 'text' });

// ============================================================
// VIRTUALS
// ============================================================

// Nombre corto para mostrar
clientSchema.virtual('displayName').get(function() {
  if (this.type === 'Jurídico') return this.businessName;
  return this.businessName;
});

// Inicial del nombre (para avatares)
clientSchema.virtual('initial').get(function() {
  if (!this.businessName) return '?';
  return this.businessName.charAt(0).toUpperCase();
});

// ============================================================
// MÉTODOS
// ============================================================

// Verificar si tiene ventas o cotizaciones
clientSchema.methods.hasTransactions = async function() {
  const Sale = mongoose.model('Sale');
  const Quotation = mongoose.model('Quotation');

  const [hasSales, hasQuotations] = await Promise.all([
    Sale.exists({ client: this._id }),
    Quotation.exists({ client: this._id })
  ]);

  return !!(hasSales || hasQuotations);
};

// Contar ventas y cotizaciones
clientSchema.methods.getStats = async function() {
  const Sale = mongoose.model('Sale');
  const Quotation = mongoose.model('Quotation');

  const [salesCount, quotationsCount, salesTotal] = await Promise.all([
    Sale.countDocuments({ client: this._id }),
    Quotation.countDocuments({ client: this._id }),
    Sale.aggregate([
      { $match: { client: this._id, status: { $ne: 'Anulado' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])
  ]);

  return {
    salesCount,
    quotationsCount,
    salesTotal: salesTotal[0] ? salesTotal[0].total : 0
  };
};

// ============================================================
// EXPORTAR
// ============================================================
module.exports = mongoose.model('Client', clientSchema);