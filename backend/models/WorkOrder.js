const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Baja', 'Media', 'Alta', 'Urgente'], default: 'Media' },
  assignedTo: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'], default: 'Pendiente' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

workOrderSchema.pre('save', async function(next) {
  if (!this.number) {
    const count = await mongoose.model('WorkOrder').countDocuments();
    this.number = `OT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('WorkOrder', workOrderSchema);