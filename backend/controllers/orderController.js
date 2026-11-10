const Order = require('../models/Order');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Quotation = require('../models/Quotation');

// ============================================================
// LISTADO
// ============================================================
exports.index = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('client', 'businessName')
      .populate('quotation', 'number')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.render('orders/index', { 
      title: 'Pedidos', 
      orders 
    });
  } catch (error) {
    console.error('❌ Error index pedidos:', error);
    req.flash('error', 'Error al cargar pedidos');
    res.redirect('/');
  }
};

// ============================================================
// CREAR (formulario)
// ============================================================
exports.create = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true });
    const products = await Product.find({ isActive: true });
    const quotations = await Quotation.find({ status: 'Aprobada' });

    res.render('orders/create', { 
      title: 'Nuevo Pedido', 
      clients, 
      products, 
      quotations 
    });
  } catch (error) {
    console.error('❌ Error create pedido:', error);
    req.flash('error', 'Error al cargar datos');
    res.redirect('/orders');
  }
};

// ============================================================
// GUARDAR
// ============================================================
exports.store = async (req, res) => {
  try {
    const { 
      client, 
      quotation, 
      deliveryDate, 
      items, 
      notes 
    } = req.body;

    // 🔑 Tomar el ID del usuario logueado correctamente
    const userId = req.session.user._id || req.session.user.id;

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
      createdBy: userId // <-- Corregido
    });

    await order.save();

    req.flash('success', 'Pedido creado correctamente');
    res.redirect('/orders');
  } catch (error) {
    console.error('❌ Error store pedido:', error);
    req.flash('error', 'Error al crear pedido: ' + error.message);
    res.redirect('/orders/create');
  }
};

// ============================================================
// MOSTRAR DETALLE
// ============================================================
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

    res.render('orders/detail', { 
      title: `Pedido ${order.number}`, 
      order 
    });
  } catch (error) {
    console.error('❌ Error show pedido:', error);
    req.flash('error', 'Error al cargar pedido');
    res.redirect('/orders');
  }
};

// ============================================================
// EDITAR (formulario)
// ============================================================
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

    res.render('orders/edit', { 
      title: 'Editar Pedido', 
      order, 
      clients, 
      products, 
      quotations 
    });
  } catch (error) {
    console.error('❌ Error edit pedido:', error);
    req.flash('error', 'Error al cargar pedido');
    res.redirect('/orders');
  }
};

// ============================================================
// ACTUALIZAR
// ============================================================
exports.update = async (req, res) => {
  try {
    const { 
      client, 
      quotation, 
      deliveryDate, 
      items, 
      notes, 
      status 
    } = req.body;

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
    console.error('❌ Error update pedido:', error);
    req.flash('error', 'Error al actualizar pedido');
    res.redirect(`/orders/${req.params.id}/edit`);
  }
};

// ============================================================
// ELIMINAR
// ============================================================
exports.destroy = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    req.flash('success', 'Pedido eliminado');
    res.redirect('/orders');
  } catch (error) {
    console.error('❌ Error destroy pedido:', error);
    req.flash('error', 'Error al eliminar pedido');
    res.redirect('/orders');
  }
};