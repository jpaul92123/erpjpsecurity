const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  type: { type: String, enum: ['entry', 'exit'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  documentNumber: { type: String, default: '' },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);