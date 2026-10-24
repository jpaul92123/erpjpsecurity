const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');

// Mostrar entradas
exports.entries = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const warehouses = await Warehouse.find({ isActive: true });
    const movements = await StockMovement.find({ type: 'entry' })
      .populate('product', 'name code')
      .populate('warehouse', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.render('stock/entries', { title: 'Entradas de Inventario', movements, products, warehouses });
  } catch (error) {
    req.flash('error', 'Error al cargar entradas');
    res.redirect('/');
  }
};

// Registrar entrada
exports.storeEntry = async (req, res) => {
  try {
    const { product, warehouse, quantity, unitPrice, description, documentNumber } = req.body;
    const total = quantity * unitPrice;
    await StockMovement.create({
      product,
      warehouse,
      type: 'entry',
      quantity,
      unitPrice,
      total,
      description,
      documentNumber,
      createdBy: req.session.user.id
    });
    req.flash('success', 'Entrada registrada correctamente');
    res.redirect('/stock/entries');
  } catch (error) {
    req.flash('error', 'Error al registrar entrada');
    res.redirect('/stock/entries');
  }
};

// Mostrar salidas
exports.exits = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const warehouses = await Warehouse.find({ isActive: true });
    const movements = await StockMovement.find({ type: 'exit' })
      .populate('product', 'name code')
      .populate('warehouse', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.render('stock/exits', { title: 'Salidas de Inventario', movements, products, warehouses });
  } catch (error) {
    req.flash('error', 'Error al cargar salidas');
    res.redirect('/');
  }
};

// Registrar salida
exports.storeExit = async (req, res) => {
  try {
    const { product, warehouse, quantity, description, documentNumber } = req.body;
    // Verificar stock disponible (opcional: podrías hacer una consulta agregada)
    await StockMovement.create({
      product,
      warehouse,
      type: 'exit',
      quantity,
      unitPrice: 0,
      total: 0,
      description,
      documentNumber,
      createdBy: req.session.user.id
    });
    req.flash('success', 'Salida registrada correctamente');
    res.redirect('/stock/exits');
  } catch (error) {
    req.flash('error', 'Error al registrar salida');
    res.redirect('/stock/exits');
  }
};