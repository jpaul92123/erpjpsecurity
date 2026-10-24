const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  type: { type: String, enum: ['Boleta', 'Factura', 'Nota de Crédito', 'Nota de Débito'], required: true },
  number: { type: String, required: true, unique: true },
  sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  ruc: { type: String, required: true },
  businessName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  subtotal: { type: Number, required: true, min: 0 },
  igv: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Emitido', 'Anulado'], default: 'Emitido' },
  pdfUrl: { type: String, default: '' },
  xmlUrl: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);