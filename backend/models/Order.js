const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  date: { type: Date, default: Date.now },
  deliveryDate: { type: Date },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  }],
  subtotal: { type: Number, required: true, min: 0 },
  igv: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pendiente', 'Aprobado', 'En Proceso', 'Completado', 'Cancelado'], default: 'Pendiente' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (!this.number) {
    const count = await mongoose.model('Order').countDocuments();
    this.number = `PED-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);