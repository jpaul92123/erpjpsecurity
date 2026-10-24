const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  technician: { type: String, required: true },
  date: { type: Date, required: true },
  purpose: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Programada', 'Realizada', 'Cancelada'], default: 'Programada' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);