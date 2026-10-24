// models/Quotation.js
const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  number: {
    type: String,
    unique: true,
    default: function() {
      // Generar número automático: COT-YYYYMMDD-XXXX
      const now = new Date();
      const datePart = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
      // Buscar el último número para hoy y sumar 1 (se hará en pre-save)
      return `COT-${datePart}-0001`;
    }
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    image: String
  }],
  subtotal: Number,
  igv: Number,
  discount: Number,
  total: Number,
  includeIgv: {
    type: Boolean,
    default: true  // Por defecto, los precios incluyen IGV
  },
  rucDni: String,
  celular: String,
  modalidadPago: {
    type: String,
    default: 'Contado'
  },
  garantiaMeses: {
    type: Number,
    default: 0
  },
  notas: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pendiente', 'Aprobada', 'Rechazada', 'Vencida'],
    default: 'Pendiente'
  },
  // models/Quotation.js (agregar dentro del esquema)
convertedToSale: {
  type: Boolean,
  default: false
},
saleId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Sale'
}
}, {
  timestamps: true
});

// Middleware para generar número secuencial
quotationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const now = new Date();
    const datePart = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const lastQuotation = await this.constructor.findOne({
      number: { $regex: `^COT-${datePart}` }
    }).sort({ number: -1 });
    let seq = 1;
    if (lastQuotation) {
      const parts = lastQuotation.number.split('-');
      seq = parseInt(parts[2]) + 1;
    }
    this.number = `COT-${datePart}-${String(seq).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);