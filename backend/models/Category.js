const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Índice compuesto para evitar duplicados en el mismo nivel
categorySchema.index({ name: 1, parent: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);