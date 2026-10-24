const Quotation = require('../models/Quotation');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Sale = require('../models/Sale');

// ============================================================
// LISTADO
// ============================================================
exports.index = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate('client', 'businessName')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.render('quotations/index', {
      title: 'Cotizaciones',
      quotations
    });
  } catch (error) {
    console.error('Error index Quotation:', error);
    req.flash('error', 'Error al cargar cotizaciones');
    res.redirect('/');
  }
};

// ============================================================
// CREAR (formulario)
// ============================================================
exports.create = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true }).sort({ businessName: 1 });

    res.render('quotations/create', {
      title: 'Nueva Cotización',
      clients,
      quotation: { includeIgv: true, discount: 0, items: [] }
    });
  } catch (error) {
    console.error('Error create Quotation:', error);
    req.flash('error', 'Error al cargar datos');
    res.redirect('/quotations');
  }
};

// ============================================================
// GUARDAR
// ============================================================
exports.store = async (req, res) => {
  try {
    const {
      client,
      validUntil,
      items,
      rucDni,
      celular,
      modalidadPago,
      garantiaMeses,
      notas,
      discount,
      includeIgv
    } = req.body;

    let clientId = client;

    // Cliente anónimo
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
    }

    // Procesar items
    let parsedItems = [];
    if (items && items.length) {
      parsedItems = items.map(item => ({
        product: item.product || null,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        total: parseFloat(item.quantity) * parseFloat(item.unitPrice),
        image: item.image || '/img/product-default.png'
      }));
    }

    const subtotal = parsedItems.reduce((acc, item) => acc + item.total, 0);
    const includeIgvBool = (includeIgv === 'on');
    const igv = includeIgvBool ? 0 : subtotal * 0.18;
    const discountValue = parseFloat(discount) || 0;
    const total = subtotal + igv - discountValue;

    const quotation = new Quotation({
      client: clientId,
      validUntil: new Date(validUntil),
      items: parsedItems,
      subtotal,
      igv,
      discount: discountValue,
      total,
      includeIgv: includeIgvBool,
      rucDni: rucDni || '',
      celular: celular || '',
      modalidadPago: modalidadPago || 'Contado',
      garantiaMeses: parseInt(garantiaMeses) || 0,
      notas: notas || '',
      createdBy: req.session.user.id
    });

    await quotation.save();
    req.flash('success', 'Cotización creada correctamente');
    res.redirect('/quotations');
  } catch (error) {
    console.error('Error al crear cotización:', error);
    req.flash('error', 'Error al crear cotización: ' + error.message);
    res.redirect('/quotations/create');
  }
};

// ============================================================
// MOSTRAR
// ============================================================
exports.show = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('client', 'businessName ruc email phone')
      .populate('createdBy', 'name')
      .populate('items.product', 'name model image')
      .populate('saleId', 'number date total');

    if (!quotation) {
      req.flash('error', 'Cotización no encontrada');
      return res.redirect('/quotations');
    }

    const clients = await Client.find({ isActive: true }).sort({ businessName: 1 });

    res.render('quotations/detail', {
      title: `Cotización ${quotation.number}`,
      quotation,
      clients,
      isConverted: quotation.convertedToSale || false,
      sale: quotation.saleId
    });
  } catch (error) {
    console.error('Error show Quotation:', error);
    req.flash('error', 'Error al cargar cotización');
    res.redirect('/quotations');
  }
};

// ============================================================
// EDITAR (formulario)
// ============================================================
exports.edit = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      req.flash('error', 'Cotización no encontrada');
      return res.redirect('/quotations');
    }

    const clients = await Client.find({ isActive: true }).sort({ businessName: 1 });
    if (quotation.includeIgv === undefined) quotation.includeIgv = true;

    res.render('quotations/edit', {
      title: 'Editar Cotización',
      quotation,
      clients
    });
  } catch (error) {
    console.error('Error edit Quotation:', error);
    req.flash('error', 'Error al cargar cotización');
    res.redirect('/quotations');
  }
};

// ============================================================
// ACTUALIZAR
// ============================================================
exports.update = async (req, res) => {
  try {
    const {
      client,
      validUntil,
      items,
      rucDni,
      celular,
      modalidadPago,
      garantiaMeses,
      notas,
      discount,
      includeIgv
    } = req.body;

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
    }

    let parsedItems = [];
    if (items && items.length) {
      parsedItems = items.map(item => ({
        product: item.product || null,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        total: parseFloat(item.quantity) * parseFloat(item.unitPrice),
        image: item.image || '/img/product-default.png'
      }));
    }

    const subtotal = parsedItems.reduce((acc, item) => acc + item.total, 0);
    const includeIgvBool = (includeIgv === 'on');
    const igv = includeIgvBool ? 0 : subtotal * 0.18;
    const discountValue = parseFloat(discount) || 0;
    const total = subtotal + igv - discountValue;

    await Quotation.findByIdAndUpdate(req.params.id, {
      client: clientId,
      validUntil: new Date(validUntil),
      items: parsedItems,
      subtotal,
      igv,
      discount: discountValue,
      total,
      includeIgv: includeIgvBool,
      rucDni: rucDni || '',
      celular: celular || '',
      modalidadPago: modalidadPago || 'Contado',
      garantiaMeses: parseInt(garantiaMeses) || 0,
      notas: notas || ''
    });

    req.flash('success', 'Cotización actualizada');
    res.redirect('/quotations');
  } catch (error) {
    console.error('Error al actualizar:', error);
    req.flash('error', 'Error al actualizar cotización');
    res.redirect(`/quotations/${req.params.id}/edit`);
  }
};

// ============================================================
// ELIMINAR
// ============================================================
exports.destroy = async (req, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    req.flash('success', 'Cotización eliminada');
    res.redirect('/quotations');
  } catch (error) {
    console.error('Error destroy Quotation:', error);
    req.flash('error', 'Error al eliminar cotización');
    res.redirect('/quotations');
  }
};

// ============================================================
// API: BUSCAR PRODUCTOS
// ============================================================
exports.searchProducts = async (req, res) => {
  try {
    const term = req.query.q || '';
    if (!term || term.length < 2) return res.json([]);

    const query = {
      isActive: true,
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { model: { $regex: term, $options: 'i' } }
      ]
    };

    const products = await Product.find(query)
      .select('name model customerPrice price image _id')
      .limit(10)
      .lean();

    const normalized = products.map(p => ({
      _id: p._id,
      name: p.name,
      model: p.model || '',
      customerPrice: p.customerPrice !== undefined ? p.customerPrice : (p.price || 0),
      image: p.image || '/img/product-default.png'
    }));

    res.json(normalized);
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
};

// ============================================================
// API: CREAR CLIENTE
// ============================================================
exports.createClient = async (req, res) => {
  try {
    const { businessName, ruc, email, phone, type } = req.body;
    const client = new Client({
      businessName,
      ruc: ruc || '',
      email: email || '',
      phone: phone || '',
      type: type || 'Natural',
      createdBy: req.session.user.id
    });
    await client.save();
    res.json({ success: true, client });
  } catch (error) {
    console.error('Error createClient API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// API: CREAR PRODUCTO
// ============================================================
exports.createProduct = async (req, res) => {
  try {
    const { name, model, customerPrice, category } = req.body;
    const product = new Product({
      name,
      model: model || '',
      customerPrice: parseFloat(customerPrice),
      supplierPrice: 0,
      category: category || null,
      isActive: true,
      createdBy: req.session.user.id
    });
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error createProduct API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// API: TEST
// ============================================================
exports.testApi = (req, res) => {
  res.json({
    success: true,
    message: 'API de cotizaciones funcionando',
    timestamp: new Date(),
    user: req.session.user ? req.session.user.name : 'No autenticado'
  });
};

// ============================================================
// CREAR VENTA DESDE COTIZACIÓN (CON LOGS DE DIAGNÓSTICO)
// ============================================================
// ============================================================
// CREAR VENTA DESDE COTIZACIÓN
// ============================================================
exports.createSaleFromQuotation = async (req, res) => {
  try {
    const quotationId = req.params.id;
    const {
      clientId,
      paymentMethod,
      notes,
      saleDate,
      businessName,
      ruc,
      email,
      phone,
      type
    } = req.body;

    console.log('\n🛒 ═══════════════════════════════════════');
    console.log('   INICIANDO CREACIÓN DE VENTA');
    console.log('═══════════════════════════════════════');
    console.log('   Cotización ID:', quotationId);
    console.log('   clientId:', clientId);
    console.log('   businessName:', businessName);
    console.log('   paymentMethod:', paymentMethod);
    console.log('   Body completo:', JSON.stringify(req.body, null, 2));
    console.log('═══════════════════════════════════════\n');

    // ---- 1. Buscar cotización ----
    const quotation = await Quotation.findById(quotationId).populate('items.product');
    if (!quotation) {
      console.error('❌ Cotización no encontrada:', quotationId);
      req.flash('error', 'Cotización no encontrada');
      return res.redirect('/quotations');
    }

    console.log('✅ Cotización encontrada:', quotation.number);
    console.log('   Cliente en cotización:', quotation.client);
    console.log('   Items:', quotation.items.length);
    console.log('   Convertida previamente:', quotation.convertedToSale);

    // ---- 2. Validar que no esté convertida ----
    if (quotation.convertedToSale) {
      console.error('❌ La cotización ya está convertida');
      req.flash('error', 'Esta cotización ya fue convertida en venta');
      return res.redirect(`/quotations/${quotationId}`);
    }

    // ---- 3. Validar items ----
    if (!quotation.items || quotation.items.length === 0) {
      console.error('❌ La cotización no tiene items');
      req.flash('error', 'La cotización no tiene items para crear una venta');
      return res.redirect(`/quotations/${quotationId}`);
    }

    // ---- 4. Procesar cliente ----
    let client;

    if (clientId === 'new') {
      // === CLIENTE NUEVO ===
      console.log('📝 Creando cliente nuevo...');

      if (!businessName || !businessName.trim()) {
        console.error('❌ Falta el nombre del cliente nuevo');
        req.flash('error', 'El nombre del cliente es obligatorio');
        return res.redirect(`/quotations/${quotationId}`);
      }

      const newClient = new Client({
        businessName: businessName.trim(),
        ruc: (ruc || '').trim(),
        email: (email || '').trim(),
        phone: (phone || '').trim(),
        type: type || 'Natural',
        createdBy: req.session.user.id,
        isActive: true
      });
      await newClient.save();
      client = newClient._id;
      console.log('✅ Cliente nuevo creado:', newClient.businessName, '→', client);

    } else if (clientId && clientId !== '') {
      // === CLIENTE EXISTENTE SELECCIONADO ===
      console.log('🔍 Buscando cliente existente:', clientId);
      const existingClient = await Client.findById(clientId);
      if (!existingClient) {
        console.error('❌ Cliente no válido:', clientId);
        req.flash('error', 'Cliente no válido');
        return res.redirect(`/quotations/${quotationId}`);
      }
      client = existingClient._id;
      console.log('✅ Cliente existente:', existingClient.businessName);

    } else {
      // === SIN SELECCIÓN: usar el cliente de la cotización ===
      console.log('ℹ️ No se seleccionó cliente, usando el de la cotización');
      if (quotation.client) {
        client = quotation.client._id || quotation.client;
        console.log('✅ Cliente de la cotización:', client);
      } else {
        // Cliente anónimo como último recurso
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
        client = anonymous._id;
        console.log('✅ Cliente anónimo:', client);
      }
    }

    // ---- 5. Preparar items de venta ----
    const saleItems = quotation.items.map(item => ({
      product: item.product ? (item.product._id || item.product) : null,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    }));

    console.log('✅ Sale items preparados:', saleItems.length);

    // ---- 6. Crear venta ----
    console.log('💾 Creando venta en BD...');

    const sale = new Sale({
      client: client,
      date: saleDate ? new Date(saleDate) : new Date(),
      items: saleItems,
      subtotal: quotation.subtotal,
      igv: quotation.igv,
      discount: quotation.discount || 0,
      total: quotation.total,
      includeIgv: quotation.includeIgv,
      paymentMethod: paymentMethod || 'Efectivo',
      status: 'Pendiente',
      notes: notes || `Venta generada desde cotización ${quotation.number}`,
      createdBy: req.session.user.id,
      convertedFromQuotation: quotation._id
    });

    await sale.save();

    console.log('✅ Venta creada exitosamente:');
    console.log('   ID:', sale._id);
    console.log('   Número:', sale.number || 'NO GENERADO');
    console.log('   Total:', sale.total);

    // ---- 7. Marcar cotización como convertida ----
    await Quotation.findByIdAndUpdate(quotationId, {
      convertedToSale: true,
      saleId: sale._id
    });

    console.log('✅ Cotización marcada como convertida');
    console.log('   Redirigiendo a /sales/' + sale._id);
    console.log('═══════════════════════════════════════');
    console.log('   ✅ PROCESO COMPLETADO');
    console.log('═══════════════════════════════════════\n');

    req.flash('success', `✅ Venta ${sale.number || sale._id} creada correctamente`);
    res.redirect(`/sales/${sale._id}`);

  } catch (error) {
    console.error('\n❌❌❌ ERROR AL CREAR VENTA ❌❌❌');
    console.error('   Nombre:', error.name);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Body:', JSON.stringify(req.body, null, 2));
    console.error('   Params:', req.params);
    console.error('═══════════════════════════════════════\n');

    req.flash('error', 'Error al crear venta: ' + error.message);
    res.redirect(`/quotations/${req.params.id}`);
  }
};