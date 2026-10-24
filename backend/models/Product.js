const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  model: { type: String, default: '' },
  image: { type: String, default: '' },

  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  // ✅ AGREGAR ESTA LÍNEA
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },

  supplierPrice: { type: Number, default: 0 },
  customerPrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  techSheet: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);