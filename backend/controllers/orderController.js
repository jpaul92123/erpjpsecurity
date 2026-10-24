const Order = require('../models/Order');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Quotation = require('../models/Quotation');

exports.index = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('client', 'businessName')
      .populate('quotation', 'number')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.render('orders/index', { title: 'Pedidos', orders });
  } catch (error) {
    req.flash('error', 'Error al cargar pedidos');
    res.redirect('/');
  }
};

exports.create = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true });
    const products = await Product.find({ isActive: true });
    const quotations = await Quotation.find({ status: 'Aprobada' });
    res.render('orders/create', { title: 'Nuevo Pedido', clients, products, quotations });
  } catch (error) {
    req.flash('error', 'Error al cargar datos');
    res.redirect('/orders');
  }
};

exports.store = async (req, res) => {
  try {
    const { client, quotation, deliveryDate, items, notes } = req.body;
    let subtotal = 0;
    const itemsArray = items.map(item => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return {
        product: item.product || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total
      };
    });
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const order = new Order({
      client,
      quotation: quotation || null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      items: itemsArray,
      subtotal,
      igv,
      total,
      notes: notes || '',
      createdBy: req.session.user.id
    });
    await order.save();
    req.flash('success', 'Pedido creado correctamente');
    res.redirect('/orders');
  } catch (error) {
    req.flash('error', 'Error al crear pedido: ' + error.message);
    res.redirect('/orders/create');
  }
};

exports.show = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'businessName ruc email phone')
      .populate('quotation', 'number')
      .populate('createdBy', 'name')
      .populate('items.product', 'name code');
    if (!order) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/orders');
    }
    res.render('orders/detail', { title: `Pedido ${order.number}`, order });
  } catch (error) {
    req.flash('error', 'Error al cargar pedido');
    res.redirect('/orders');
  }
};

exports.edit = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/orders');
    }
    const clients = await Client.find({ isActive: true });
    const products = await Product.find({ isActive: true });
    const quotations = await Quotation.find({ status: 'Aprobada' });
    res.render('orders/edit', { title: 'Editar Pedido', order, clients, products, quotations });
  } catch (error) {
    req.flash('error', 'Error al cargar pedido');
    res.redirect('/orders');
  }
};

exports.update = async (req, res) => {
  try {
    const { client, quotation, deliveryDate, items, notes, status } = req.body;
    let subtotal = 0;
    const itemsArray = items.map(item => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return {
        product: item.product || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total
      };
    });
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    await Order.findByIdAndUpdate(req.params.id, {
      client,
      quotation: quotation || null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      items: itemsArray,
      subtotal,
      igv,
      total,
      status,
      notes: notes || ''
    });
    req.flash('success', 'Pedido actualizado');
    res.redirect('/orders');
  } catch (error) {
    req.flash('error', 'Error al actualizar pedido');
    res.redirect(`/orders/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    req.flash('success', 'Pedido eliminado');
    res.redirect('/orders');
  } catch (error) {
    req.flash('error', 'Error al eliminar pedido');
    res.redirect('/orders');
  }
};