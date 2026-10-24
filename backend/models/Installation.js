const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  equipment: { type: String, required: true },
  serialNumber: { type: String, default: '' },
  installationDate: { type: Date, required: true },
  technician: { type: String, required: true },
  status: { type: String, enum: ['Programado', 'En Progreso', 'Completado', 'Cancelado'], default: 'Programado' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Installation', installationSchema);