// models/Brand.js
const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la marca es obligatorio'],
    unique: true,
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  // ✅ NUEVO: Logo de la marca
  logo: {
    type: String,
    default: '/img/brand-default.png'
  },
  isActive: {
    type: Boolean,
    default: true
  },
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

// Índices
brandSchema.index({ name: 1 });
brandSchema.index({ isActive: 1 });
brandSchema.index({ name: 'text', description: 'text' });

// Virtual: inicial del nombre (fallback si no hay logo)
brandSchema.virtual('initial').get(function() {
  if (!this.name) return '?';
  return this.name.charAt(0).toUpperCase();
});

// Métodos
brandSchema.methods.hasProducts = async function() {
  const Product = mongoose.model('Product');
  const hasProducts = await Product.exists({ brand: this._id });
  return !!hasProducts;
};

brandSchema.methods.getProductsCount = async function() {
  const Product = mongoose.model('Product');
  return await Product.countDocuments({ brand: this._id });
};

module.exports = mongoose.model('Brand', brandSchema);