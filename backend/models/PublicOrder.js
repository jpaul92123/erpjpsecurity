const mongoose = require("mongoose");

// ============================================
// SUB-ESQUEMA: Item del pedido
// ============================================
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

// ============================================
// ESQUEMA PRINCIPAL: Pedido público
// ============================================
const publicOrderSchema = new mongoose.Schema(
  {
    // -------- Correlativo --------
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // -------- Datos del cliente --------
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: "", trim: true, lowercase: true },
      address: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      reference: { type: String, default: "", trim: true },
    },

    // -------- Modo de pago --------
    paymentMethod: {
      type: String,
      required: true,
      enum: ["yape", "plin", "transferencia", "efectivo"],
      default: "efectivo",
    },

    // -------- Datos de pago (referencia) --------
    paymentReference: { type: String, default: "" },
    paymentProof: { type: String, default: "" }, // URL de captura

    // -------- Items --------
    items: {
      type: [orderItemSchema],
      validate: [
        (arr) => arr.length > 0,
        "El pedido debe tener al menos un item",
      ],
    },

    // -------- Totales --------
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    // -------- Estado --------
    status: {
      type: String,
      enum: ["pendiente", "confirmado", "enviado", "entregado", "cancelado"],
      default: "pendiente",
    },

    // -------- Pago (NUEVO) --------
    paid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },

    // -------- Historial de cambios (opcional pero recomendado) --------
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        note: { type: String, default: "" },
      },
    ],
    // -------- Notas --------
    notes: { type: String, default: "", trim: true },

    // -------- Datos del pedido público (sin user) --------
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// ============================================
// MÉTODO ESTÁTICO: Generar número de pedido
// ============================================
publicOrderSchema.statics.generateOrderNumber = async function () {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const prefix = `PED-${year}${month}${day}-`;

  const lastOrder = await this.findOne({
    orderNumber: new RegExp("^" + prefix),
  }).sort({ orderNumber: -1 });

  let nextNumber = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextNumber = lastNum + 1;
  }

  return prefix + String(nextNumber).padStart(4, "0");
};

module.exports = mongoose.model("PublicOrder", publicOrderSchema);
