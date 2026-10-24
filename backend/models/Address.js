const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  country: { type: String, default: 'Perú' },
  reference: { type: String, default: '' },
  isMain: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);