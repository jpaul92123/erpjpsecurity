// ============================================================
// controllers/supplierController.js
// ============================================================
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

// ============================================================
// LISTADO
// ============================================================
exports.index = async (req, res) => {
  try {
    console.log('📊 [supplierController.index] Cargando proveedores...');

    const suppliers = await Supplier.find()
      .populate('createdBy', 'name')
      .sort({ businessName: 1 })
      .lean();

    console.log('✅ Proveedores cargados:', suppliers.length);

    res.render('suppliers/index', {
      title: 'Proveedores',
      suppliers
    });
  } catch (error) {
    console.error('❌ Error al cargar proveedores:', error);
    req.flash('error', 'Error al cargar proveedores');
    res.redirect('/');
  }
};

// ============================================================
// FORMULARIO DE CREACIÓN
// ============================================================
exports.create = (req, res) => {
  res.render('suppliers/create', {
    title: 'Nuevo Proveedor'
  });
};

// ============================================================
// GUARDAR NUEVO PROVEEDOR
// ============================================================
exports.store = async (req, res) => {
  try {
    const { businessName, ruc, email, phone, address, contactPerson } = req.body;

    console.log('🆕 [supplierController.store] Creando proveedor...');
    console.log('   businessName:', businessName);
    console.log('   ruc:', ruc);

    // Validaciones básicas
    if (!businessName || !businessName.trim()) {
      req.flash('error', 'El nombre del proveedor es obligatorio');
      return res.redirect('/suppliers/create');
    }

    const supplier = await Supplier.create({
      businessName: businessName.trim(),
      ruc: ruc.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: (address || '').trim(),
      contactPerson: (contactPerson || '').trim(),
      isActive: true,
      createdBy: req.session.user.id
    });

    console.log('✅ Proveedor creado:', supplier._id, supplier.businessName);
    req.flash('success', `✅ Proveedor "${supplier.businessName}" creado correctamente`);
    res.redirect('/suppliers');
  } catch (error) {
    console.error('❌ Error al crear proveedor:', error);

    if (error.code === 11000) {
      req.flash('error', 'Ya existe un proveedor con ese RUC');
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      req.flash('error', 'Error de validación: ' + messages);
    } else {
      req.flash('error', 'Error al crear proveedor: ' + error.message);
    }

    res.redirect('/suppliers/create');
  }
};

// ============================================================
// MOSTRAR DETALLE
// ============================================================
exports.show = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!supplier) {
      req.flash('error', 'Proveedor no encontrado');
      return res.redirect('/suppliers');
    }

    // ✅ Contar productos asociados
    const productsCount = await Product.countDocuments({ supplier: supplier._id });
    supplier.productsCount = productsCount;

    console.log(`📋 Proveedor: ${supplier.businessName}`);
    console.log(`   Productos asociados: ${productsCount}`);

    res.render('suppliers/detail', {
      title: supplier.businessName,
      supplier
    });
  } catch (error) {
    console.error('❌ Error al cargar proveedor:', error);
    req.flash('error', 'Error al cargar proveedor');
    res.redirect('/suppliers');
  }
};

// ============================================================
// FORMULARIO DE EDICIÓN
// ============================================================
exports.edit = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).lean();

    if (!supplier) {
      req.flash('error', 'Proveedor no encontrado');
      return res.redirect('/suppliers');
    }

    res.render('suppliers/edit', {
      title: 'Editar Proveedor',
      supplier
    });
  } catch (error) {
    console.error('❌ Error al cargar proveedor:', error);
    req.flash('error', 'Error al cargar proveedor');
    res.redirect('/suppliers');
  }
};

// ============================================================
// ACTUALIZAR
// ============================================================
exports.update = async (req, res) => {
  try {
    const { businessName, ruc, email, phone, address, contactPerson, isActive } = req.body;

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        businessName: businessName.trim(),
        ruc: ruc.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: (address || '').trim(),
        contactPerson: (contactPerson || '').trim(),
        isActive: isActive === 'on'
      },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      req.flash('error', 'Proveedor no encontrado');
      return res.redirect('/suppliers');
    }

    console.log('✅ Proveedor actualizado:', supplier._id);
    req.flash('success', `✅ Proveedor "${supplier.businessName}" actualizado correctamente`);
    res.redirect(`/suppliers/${supplier._id}`);
  } catch (error) {
    console.error('❌ Error al actualizar proveedor:', error);

    if (error.code === 11000) {
      req.flash('error', 'Ya existe un proveedor con ese RUC');
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      req.flash('error', 'Error de validación: ' + messages);
    } else {
      req.flash('error', 'Error al actualizar proveedor');
    }

    res.redirect(`/suppliers/${req.params.id}/edit`);
  }
};

// ============================================================
// ELIMINAR
// ============================================================
exports.destroy = async (req, res) => {
  try {
    const supplierId = req.params.id;

    // ✅ Verificar que no tenga productos asociados
    const hasProducts = await Product.findOne({ supplier: supplierId });

    if (hasProducts) {
      console.log('⚠️ Proveedor tiene productos asociados');
      req.flash('error', 'No se puede eliminar: el proveedor tiene productos asociados');
      return res.redirect('/suppliers');
    }

    const supplier = await Supplier.findByIdAndDelete(supplierId);

    if (!supplier) {
      req.flash('error', 'Proveedor no encontrado');
      return res.redirect('/suppliers');
    }

    console.log('🗑️ Proveedor eliminado:', supplierId);
    req.flash('success', '🗑️ Proveedor eliminado correctamente');
    res.redirect('/suppliers');
  } catch (error) {
    console.error('❌ Error al eliminar proveedor:', error);
    req.flash('error', 'No se puede eliminar, puede estar en uso');
    res.redirect('/suppliers');
  }
};

// ============================================================
// API: BUSCAR PROVEEDORES (autocompletar)
// ============================================================
exports.searchSuppliers = async (req, res) => {
  try {
    const term = req.query.q || '';
    if (!term || term.length < 2) return res.json([]);

    const suppliers = await Supplier.find({
      isActive: true,
      $or: [
        { businessName: { $regex: term, $options: 'i' } },
        { ruc: { $regex: term, $options: 'i' } }
      ]
    })
      .select('businessName ruc email phone')
      .limit(10)
      .lean();

    res.json(suppliers);
  } catch (error) {
    console.error('❌ Error en búsqueda de proveedores:', error);
    res.status(500).json({ error: 'Error al buscar proveedores' });
  }
};

// ============================================================
// API: OBTENER DATOS DE PROVEEDOR (AJAX)
// ============================================================
exports.getSupplierData = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).lean();

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('❌ Error al obtener proveedor:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
};