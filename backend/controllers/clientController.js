const Client = require('../models/Client');
const Contact = require('../models/Contact');
const Address = require('../models/Address');
const Sale = require('../models/Sale');
const Quotation = require('../models/Quotation');

// ============================================================
// LISTADO DE CLIENTES
// ============================================================
exports.index = async (req, res) => {
  try {
    console.log('📊 [clientController.index] Cargando clientes...');

    const clients = await Client.find()
      .populate('createdBy', 'name email')
      .sort({ businessName: 1 })
      .lean();

    console.log('✅ Clientes cargados:', clients.length);

    res.render('clients/index', {
      title: 'Clientes',
      clients
    });
  } catch (error) {
    console.error('❌ Error al cargar clientes:', error);
    req.flash('error', 'Error al cargar clientes');
    res.redirect('/');
  }
};

// ============================================================
// FORMULARIO DE CREACIÓN
// ============================================================
exports.create = (req, res) => {
  res.render('clients/create', {
    title: 'Nuevo Cliente',
    client: null
  });
};

// ============================================================
// GUARDAR NUEVO CLIENTE
// ============================================================
exports.store = async (req, res) => {
  try {
    const { businessName, ruc, email, phone, type, address } = req.body;

    console.log('🆕 [clientController.store] Creando cliente...');
    console.log('   businessName:', businessName);
    console.log('   ruc:', ruc);

    // Validaciones básicas
    if (!businessName || !businessName.trim()) {
      req.flash('error', 'El nombre del cliente es obligatorio');
      return res.redirect('/clients/create');
    }

    const client = new Client({
      businessName: businessName.trim(),
      ruc: (ruc || '').trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      type: type || 'Natural',
      isActive: true,
      createdBy: req.session.user.id
    });

    await client.save();

    console.log('✅ Cliente creado:', client._id, client.businessName);
    req.flash('success', `✅ Cliente "${client.businessName}" creado correctamente`);
    res.redirect('/clients');
  } catch (error) {
    console.error('❌ Error al crear cliente:', error);

    if (error.code === 11000) {
      req.flash('error', 'Ya existe un cliente con ese RUC');
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      req.flash('error', 'Error de validación: ' + messages);
    } else {
      req.flash('error', 'Error al crear el cliente: ' + error.message);
    }

    res.redirect('/clients/create');
  }
};

// ============================================================
// MOSTRAR DETALLE DE CLIENTE
// ============================================================
exports.show = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('contacts')
      .populate('addresses')
      .populate('createdBy', 'name email')
      .lean();

    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }

    // ✅ Contar ventas y cotizaciones del cliente
    const [salesCount, quotationsCount] = await Promise.all([
      Sale.countDocuments({ client: client._id }),
      Quotation.countDocuments({ client: client._id })
    ]);

    client.salesCount = salesCount;
    client.quotationsCount = quotationsCount;

    console.log(`📋 Cliente: ${client.businessName}`);
    console.log(`   Ventas: ${salesCount}, Cotizaciones: ${quotationsCount}`);
    console.log(`   Contactos: ${client.contacts ? client.contacts.length : 0}`);
    console.log(`   Direcciones: ${client.addresses ? client.addresses.length : 0}`);

    res.render('clients/detail', {
      title: client.businessName,
      client
    });
  } catch (error) {
    console.error('❌ Error al cargar cliente:', error);
    req.flash('error', 'Error al cargar el cliente');
    res.redirect('/clients');
  }
};

// ============================================================
// FORMULARIO DE EDICIÓN
// ============================================================
exports.edit = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).lean();

    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }

    res.render('clients/edit', {
      title: `Editar ${client.businessName}`,
      client
    });
  } catch (error) {
    console.error('❌ Error al cargar cliente para editar:', error);
    req.flash('error', 'Error al cargar el cliente');
    res.redirect('/clients');
  }
};

// ============================================================
// ACTUALIZAR CLIENTE
// ============================================================
exports.update = async (req, res) => {
  try {
    const { businessName, ruc, email, phone, type, address, isActive } = req.body;

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      {
        businessName: businessName ? businessName.trim() : '',
        ruc: (ruc || '').trim(),
        email: (email || '').trim(),
        phone: (phone || '').trim(),
        address: (address || '').trim(),
        type: type || 'Natural',
        isActive: isActive === 'on'
      },
      { new: true, runValidators: true }
    );

    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }

    console.log('✅ Cliente actualizado:', client._id);
    req.flash('success', '✅ Cliente actualizado correctamente');
    res.redirect(`/clients/${client._id}`);
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error);

    if (error.code === 11000) {
      req.flash('error', 'Ya existe un cliente con ese RUC');
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      req.flash('error', 'Error de validación: ' + messages);
    } else {
      req.flash('error', 'Error al actualizar el cliente');
    }

    res.redirect(`/clients/${req.params.id}/edit`);
  }
};

// ============================================================
// ELIMINAR CLIENTE
// ============================================================
exports.destroy = async (req, res) => {
  try {
    const clientId = req.params.id;

    // ✅ Verificar que no tenga ventas ni cotizaciones asociadas
    const [hasSales, hasQuotations] = await Promise.all([
      Sale.findOne({ client: clientId }),
      Quotation.findOne({ client: clientId })
    ]);

    if (hasSales || hasQuotations) {
      console.log('⚠️ Cliente tiene ventas o cotizaciones asociadas');
      req.flash('error', 'No se puede eliminar: el cliente tiene ventas o cotizaciones asociadas');
      return res.redirect('/clients');
    }

    const client = await Client.findByIdAndDelete(clientId);

    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }

    // Eliminar contactos y direcciones asociados
    await Promise.all([
      Contact.deleteMany({ client: clientId }),
      Address.deleteMany({ client: clientId })
    ]);

    console.log('🗑️ Cliente eliminado:', clientId);
    req.flash('success', '🗑️ Cliente eliminado correctamente');
    res.redirect('/clients');
  } catch (error) {
    console.error('❌ Error al eliminar cliente:', error);
    req.flash('error', 'Error al eliminar el cliente');
    res.redirect('/clients');
  }
};

// ============================================================
// CONTACTOS
// ============================================================

// Guardar nuevo contacto
exports.storeContact = async (req, res) => {
  try {
    const { name, position, email, phone, isMain } = req.body;

    if (!name || !name.trim()) {
      req.flash('error', 'El nombre del contacto es obligatorio');
      return res.redirect(`/clients/${req.params.id}`);
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }

    // Si se marca como principal, quitar ese flag de los demás
    if (isMain === 'on') {
      await Contact.updateMany(
        { client: client._id },
        { $set: { isMain: false } }
      );
    }

    const contact = new Contact({
      client: client._id,
      name: name.trim(),
      position: (position || '').trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      isMain: isMain === 'on'
    });

    await contact.save();

    client.contacts.push(contact._id);
    await client.save();

    console.log('✅ Contacto agregado:', contact._id);
    req.flash('success', '✅ Contacto agregado correctamente');
    res.redirect(`/clients/${client._id}`);
  } catch (error) {
    console.error('❌ Error al agregar contacto:', error);
    req.flash('error', 'Error al agregar contacto');
    res.redirect(`/clients/${req.params.id}`);
  }
};

// Eliminar contacto
exports.destroyContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.contactId);

    if (!contact) {
      req.flash('error', 'Contacto no encontrado');
      return res.redirect(`/clients/${req.params.id}`);
    }

    // Remover referencia del cliente
    await Client.updateOne(
      { _id: contact.client },
      { $pull: { contacts: contact._id } }
    );

    console.log('🗑️ Contacto eliminado:', contact._id);
    req.flash('success', '🗑️ Contacto eliminado');
    res.redirect(`/clients/${req.params.id}`);
  } catch (error) {
    console.error('❌ Error al eliminar contacto:', error);
    req.flash('error', 'Error al eliminar contacto');
    res.redirect(`/clients/${req.params.id}`);
  }
};

// ============================================================
// DIRECCIONES
// ============================================================

// Guardar nueva dirección
exports.storeAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, country, reference, isMain } = req.body;

    if (!street || !street.trim()) {
      req.flash('error', 'La dirección es obligatoria');
      return res.redirect(`/clients/${req.params.id}`);
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }

    // Si se marca como principal, quitar ese flag de las demás
    if (isMain === 'on') {
      await Address.updateMany(
        { client: client._id },
        { $set: { isMain: false } }
      );
    }

    const address = new Address({
      client: client._id,
      street: street.trim(),
      city: (city || '').trim(),
      state: (state || '').trim(),
      zipCode: (zipCode || '').trim(),
      country: (country || 'Perú').trim(),
      reference: (reference || '').trim(),
      isMain: isMain === 'on'
    });

    await address.save();

    client.addresses.push(address._id);
    await client.save();

    console.log('✅ Dirección agregada:', address._id);
    req.flash('success', '✅ Dirección agregada correctamente');
    res.redirect(`/clients/${client._id}`);
  } catch (error) {
    console.error('❌ Error al agregar dirección:', error);
    req.flash('error', 'Error al agregar dirección');
    res.redirect(`/clients/${req.params.id}`);
  }
};

// Eliminar dirección
exports.destroyAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndDelete(req.params.addressId);

    if (!address) {
      req.flash('error', 'Dirección no encontrada');
      return res.redirect(`/clients/${req.params.id}`);
    }

    await Client.updateOne(
      { _id: address.client },
      { $pull: { addresses: address._id } }
    );

    console.log('🗑️ Dirección eliminada:', address._id);
    req.flash('success', '🗑️ Dirección eliminada');
    res.redirect(`/clients/${req.params.id}`);
  } catch (error) {
    console.error('❌ Error al eliminar dirección:', error);
    req.flash('error', 'Error al eliminar dirección');
    res.redirect(`/clients/${req.params.id}`);
  }
};

// ============================================================
// API: BUSCAR CLIENTES (para autocompletar en ventas/cotizaciones)
// ============================================================
exports.searchClients = async (req, res) => {
  try {
    const term = req.query.q || '';
    if (!term || term.length < 2) return res.json([]);

    const clients = await Client.find({
      isActive: true,
      $or: [
        { businessName: { $regex: term, $options: 'i' } },
        { ruc: { $regex: term, $options: 'i' } }
      ]
    })
      .select('businessName ruc email phone type')
      .limit(10)
      .lean();

    res.json(clients);
  } catch (error) {
    console.error('❌ Error en búsqueda de clientes:', error);
    res.status(500).json({ error: 'Error al buscar clientes' });
  }
};

// ============================================================
// API: OBTENER DATOS DE UN CLIENTE (para AJAX)
// ============================================================
exports.getClientData = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('contacts')
      .populate('addresses')
      .lean();

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(client);
  } catch (error) {
    console.error('❌ Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};