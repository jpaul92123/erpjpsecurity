const Voucher = require('../models/Voucher');
const Sale = require('../models/Sale');
const Client = require('../models/Client');

exports.index = async (req, res) => {
  try {
    const vouchers = await Voucher.find()
      .populate('client', 'businessName')
      .populate('sale', 'number')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.render('vouchers/index', { title: 'Comprobantes', vouchers });
  } catch (error) {
    req.flash('error', 'Error al cargar comprobantes');
    res.redirect('/');
  }
};

exports.create = async (req, res) => {
  try {
    const sales = await Sale.find({ status: 'Pagado' }).populate('client');
    const clients = await Client.find({ isActive: true });
    res.render('vouchers/create', { title: 'Nuevo Comprobante', sales, clients });
  } catch (error) {
    req.flash('error', 'Error al cargar datos');
    res.redirect('/vouchers');
  }
};

exports.store = async (req, res) => {
  try {
    const { type, sale, client, ruc, businessName } = req.body;
    // Obtener datos de la venta para calcular totales
    const saleData = await Sale.findById(sale);
    if (!saleData) {
      req.flash('error', 'Venta no encontrada');
      return res.redirect('/vouchers/create');
    }
    const voucher = new Voucher({
      type,
      sale,
      client,
      ruc,
      businessName,
      subtotal: saleData.subtotal,
      igv: saleData.igv,
      total: saleData.total,
      createdBy: req.session.user.id
    });
    await voucher.save();
    req.flash('success', 'Comprobante emitido correctamente');
    res.redirect('/vouchers');
  } catch (error) {
    req.flash('error', 'Error al emitir comprobante: ' + error.message);
    res.redirect('/vouchers/create');
  }
};

exports.show = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id)
      .populate('client', 'businessName ruc email phone')
      .populate('sale', 'number')
      .populate('createdBy', 'name');
    if (!voucher) {
      req.flash('error', 'Comprobante no encontrado');
      return res.redirect('/vouchers');
    }
    res.render('vouchers/detail', { title: `Comprobante ${voucher.number}`, voucher });
  } catch (error) {
    req.flash('error', 'Error al cargar comprobante');
    res.redirect('/vouchers');
  }
};

exports.destroy = async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    req.flash('success', 'Comprobante eliminado');
    res.redirect('/vouchers');
  } catch (error) {
    req.flash('error', 'Error al eliminar comprobante');
    res.redirect('/vouchers');
  }
};

// Anular comprobante
exports.annul = async (req, res) => {
  try {
    await Voucher.findByIdAndUpdate(req.params.id, { status: 'Anulado' });
    req.flash('success', 'Comprobante anulado');
    res.redirect('/vouchers');
  } catch (error) {
    req.flash('error', 'Error al anular comprobante');
    res.redirect('/vouchers');
  }
};