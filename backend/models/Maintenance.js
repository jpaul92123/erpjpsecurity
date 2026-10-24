const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  equipment: { type: String, required: true },
  serialNumber: { type: String, default: '' },
  type: { type: String, enum: ['Preventivo', 'Correctivo', 'Emergencia'], required: true },
  scheduledDate: { type: Date, required: true },
  completionDate: { type: Date },
  technician: { type: String, required: true },
  status: { type: String, enum: ['Programado', 'En Progreso', 'Completado', 'Cancelado'], default: 'Programado' },
  description: { type: String, default: '' },
  cost: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);