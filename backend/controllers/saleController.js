const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Quotation = require('../models/Quotation');

// ============================================================
// LISTADO
// ============================================================
exports.index = async (req, res) => {
  try {
    console.log('📊 [saleController.index] Cargando ventas...');

    const sales = await Sale.find()
      .populate('client', 'businessName ruc')
      .populate('order', 'number')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    console.log('✅ Ventas cargadas:', sales.length);

    res.render('sales/index', {
      title: 'Ventas',
      sales,
      totalSales: sales.length,
      totalAmount: sales.reduce((acc, s) => acc + (s.total || 0), 0)
    });
  } catch (error) {
    console.error('❌ Error al cargar ventas:', error);
    req.flash('error', 'Error al cargar ventas');
    res.redirect('/');
  }
};

// ============================================================
// CREAR (formulario)
// ============================================================
exports.create = async (req, res) => {
  try {
    console.log('🆕 [saleController.create] Cargando datos para nueva venta...');

    const clients = await Client.find({ isActive: true }).sort({ businessName: 1 });
    const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();
    const orders = await Order.find({ status: 'Completado' }).sort({ createdAt: -1 });

    // ✅ Cotizaciones pendientes (NO convertidas a venta)
    const quotations = await Quotation.find({ convertedToSale: { $ne: true } })
      .populate('client', 'businessName ruc')
      .sort({ createdAt: -1 })
      .lean();

    console.log('✅ Datos cargados:');
    console.log('   - Clientes:', clients.length);
    console.log('   - Productos:', products.length);
    console.log('   - Órdenes:', orders.length);
    console.log('   - Cotizaciones pendientes:', quotations.length);

    res.render('sales/create', {
      title: 'Nueva Venta',
      clients,
      products,
      orders,
      quotations,
      sale: null
    });
  } catch (error) {
    console.error('❌ Error al cargar datos:', error);
    req.flash('error', 'Error al cargar datos');
    res.redirect('/sales');
  }
};

// ============================================================
// GUARDAR
// ============================================================
exports.store = async (req, res) => {
  try {
    const {
      client,
      order,
      items,
      paymentMethod,
      notes,
      discount,
      includeIgv,
      convertedFromQuotation
    } = req.body;

    console.log('\n🛒 ═══════════════════════════════════════');
    console.log('   GUARDANDO NUEVA VENTA');
    console.log('═══════════════════════════════════════');
    console.log('   client:', client);
    console.log('   convertedFromQuotation:', convertedFromQuotation);
    console.log('   items (raw):', JSON.stringify(items, null, 2));
    console.log('═══════════════════════════════════════\n');

    // ---- Validar items ----
    if (!items || (Array.isArray(items) && items.length === 0)) {
      req.flash('error', 'Debe agregar al menos un producto');
      return res.redirect('/sales/create');
    }

    // Normalizar items a array (por si viene un solo objeto)
    const itemsArray = Array.isArray(items) ? items : [items];

    // ---- Procesar items ----
    let subtotal = 0;
    const parsedItems = itemsArray.map(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const total = quantity * unitPrice;
      subtotal += total;
      return {
        product: item.product || null,
        description: item.description || 'Producto sin descripción',
        quantity,
        unitPrice,
        total
      };
    });

    // ---- Procesar cliente ----
    let clientId = client;

    if (!clientId || clientId === '') {
      const anonymous = await Client.findOneAndUpdate(
        { ruc: '00000000000' },
        {
          businessName: 'Cliente Anónimo',
          ruc: '00000000000',
          email: 'anonimo@jpsecurity.com',
          phone: '000000000',
          type: 'Natural',
          createdBy: req.session.user.id,
          isActive: true
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      clientId = anonymous._id;
      console.log('ℹ️ Usando cliente anónimo:', clientId);
    }

    // ---- Calcular totales ----
    const includeIgvBool = (includeIgv === 'on' || includeIgv === true || includeIgv === 'true');
    const igv = includeIgvBool ? 0 : subtotal * 0.18;
    const discountValue = parseFloat(discount) || 0;
    const total = subtotal + igv - discountValue;

    console.log('💰 Totales calculados:');
    console.log('   Subtotal:', subtotal);
    console.log('   IGV:', igv);
    console.log('   Descuento:', discountValue);
    console.log('   Total:', total);

    // ---- Crear venta ----
    const sale = new Sale({
      client: clientId,
      order: order || null,
      items: parsedItems,
      subtotal,
      igv,
      discount: discountValue,
      total,
      includeIgv: includeIgvBool,
      paymentMethod: paymentMethod || 'Efectivo',
      notes: notes || '',
      status: 'Pendiente',
      createdBy: req.session.user.id,
      convertedFromQuotation: convertedFromQuotation || null
    });

    await sale.save();

    console.log('✅ Venta creada:');
    console.log('   ID:', sale._id);
    console.log('   Número:', sale.number);
    console.log('   Total:', sale.total);

    // ---- Si viene de cotización, marcarla como convertida ----
    if (convertedFromQuotation) {
      await Quotation.findByIdAndUpdate(convertedFromQuotation, {
        convertedToSale: true,
        saleId: sale._id
      });
      console.log('✅ Cotización marcada como convertida:', convertedFromQuotation);
    }

    console.log('═══════════════════════════════════════\n');

    req.flash('success', `✅ Venta ${sale.number || sale._id} registrada correctamente`);
    res.redirect(`/sales/${sale._id}`);
  } catch (error) {
    console.error('\n❌❌❌ ERROR AL REGISTRAR VENTA ❌❌❌');
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Body:', JSON.stringify(req.body, null, 2));
    console.error('═══════════════════════════════════════\n');

    req.flash('error', 'Error al registrar venta: ' + error.message);
    res.redirect('/sales/create');
  }
};

// ============================================================
// MOSTRAR
// ============================================================
// controllers/saleController.js
exports.show = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'ID de venta inválido');
      return res.redirect('/sales');
    }

    const sale = await Sale.findById(id)
      .populate('client', 'businessName ruc email phone address type')
      .populate('createdBy', 'name email')
      .populate({
        path: 'items.product',
        select: 'name model image sku brand',
        populate: {
          path: 'brand',
          select: 'name'
        }
      })
      .populate('convertedFromQuotation', 'number')
      .lean();  // ⬅️ IMPORTANTE: lean() para que sea JSON serializable

    if (!sale) {
      req.flash('error', 'Venta no encontrada');
      return res.redirect('/sales');
    }

    res.render('sales/detail', {
      title: `Venta ${sale.number || sale._id}`,
      sale,
      items: sale.items || []
    });
  } catch (error) {
    console.error('❌ Error al mostrar venta:', error);
    req.flash('error', 'Error al cargar la venta');
    res.redirect('/sales');
  }
};

// ============================================================
// EDITAR (formulario)
// ============================================================
exports.edit = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'ID de venta inválido');
      return res.redirect('/sales');
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      req.flash('error', 'Venta no encontrada');
      return res.redirect('/sales');
    }

    const clients = await Client.find({ isActive: true }).sort({ businessName: 1 });
    const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();
    const orders = await Order.find({ status: 'Completado' }).sort({ createdAt: -1 });

    res.render('sales/edit', {
      title: `Editar Venta ${sale.number || sale._id}`,
      sale,
      clients,
      products,
      orders
    });
  } catch (error) {
    console.error('❌ Error al cargar venta para editar:', error);
    req.flash('error', 'Error al cargar venta');
    res.redirect('/sales');
  }
};

// ============================================================
// ACTUALIZAR
// ============================================================
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'ID de venta inválido');
      return res.redirect('/sales');
    }

    const {
      client,
      order,
      items,
      paymentMethod,
      status,
      notes,
      discount,
      includeIgv
    } = req.body;

    if (!items || (Array.isArray(items) && items.length === 0)) {
      req.flash('error', 'Debe agregar al menos un producto');
      return res.redirect(`/sales/${id}/edit`);
    }

    const itemsArray = Array.isArray(items) ? items : [items];

    let subtotal = 0;
    const parsedItems = itemsArray.map(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const total = quantity * unitPrice;
      subtotal += total;
      return {
        product: item.product || null,
        description: item.description || 'Producto sin descripción',
        quantity,
        unitPrice,
        total
      };
    });

    const includeIgvBool = (includeIgv === 'on' || includeIgv === true || includeIgv === 'true');
    const igv = includeIgvBool ? 0 : subtotal * 0.18;
    const discountValue = parseFloat(discount) || 0;
    const total = subtotal + igv - discountValue;

    await Sale.findByIdAndUpdate(id, {
      client,
      order: order || null,
      items: parsedItems,
      subtotal,
      igv,
      discount: discountValue,
      total,
      includeIgv: includeIgvBool,
      paymentMethod: paymentMethod || 'Efectivo',
      status: status || 'Pendiente',
      notes: notes || ''
    });

    req.flash('success', '✅ Venta actualizada correctamente');
    res.redirect(`/sales/${id}`);
  } catch (error) {
    console.error('❌ Error al actualizar venta:', error);
    req.flash('error', 'Error al actualizar venta: ' + error.message);
    res.redirect(`/sales/${req.params.id}/edit`);
  }
};

// ============================================================
// ELIMINAR
// ============================================================
exports.destroy = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'ID de venta inválido');
      return res.redirect('/sales');
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      req.flash('error', 'Venta no encontrada');
      return res.redirect('/sales');
    }

    // Verificar si la venta está asociada a una cotización
    const quotation = await Quotation.findOne({ saleId: id });
    if (quotation) {
      req.flash('error', 'No se puede eliminar una venta que está asociada a una cotización');
      return res.redirect('/sales');
    }

    await Sale.findByIdAndDelete(id);
    req.flash('success', '🗑️ Venta eliminada correctamente');
    res.redirect('/sales');
  } catch (error) {
    console.error('❌ Error al eliminar venta:', error);
    req.flash('error', 'Error al eliminar venta');
    res.redirect('/sales');
  }
};

// ============================================================
// API: OBTENER DATOS DE VENTA (para AJAX)
// ============================================================
exports.getSaleData = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const sale = await Sale.findById(id)
      .populate('client', 'businessName ruc')
      .populate('items.product', 'name model');

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json(sale);
  } catch (error) {
    console.error('❌ Error al obtener datos de venta:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

// ============================================================
// API: CAMBIAR ESTADO
// ============================================================
exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const validStatus = ['Pendiente', 'Pagado', 'Anulado'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const sale = await Sale.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({ success: true, sale });
  } catch (error) {
    console.error('❌ Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};