const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  position: { type: String, default: '' },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  isMain: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);