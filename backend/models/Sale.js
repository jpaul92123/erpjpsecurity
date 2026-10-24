// backend/models/Sale.js
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  number: { type: String, unique: true },   // ⬅️ NO required aquí
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  date: { type: Date, default: Date.now },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  subtotal: { type: Number, default: 0 },
  igv: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  includeIgv: { type: Boolean, default: true },
  paymentMethod: { type: String, default: 'Efectivo' },
  status: { type: String, default: 'Pendiente' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  convertedFromQuotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', default: null }
}, { timestamps: true });

// ✅ Generador automático de number
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.number) {
    try {
      const count = await mongoose.model('Sale').countDocuments();
      this.number = 'V-' + String(count + 1).padStart(6, '0');
    } catch (err) {
      console.error('Error generando number de venta:', err);
    }
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);