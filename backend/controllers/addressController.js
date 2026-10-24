const Address = require('../models/Address');
const Client = require('../models/Client');

// Mostrar direcciones de un cliente
exports.index = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }
    const addresses = await Address.find({ client: req.params.clientId });
    res.render('addresses/index', { title: 'Direcciones', client, addresses });
  } catch (error) {
    req.flash('error', 'Error al cargar direcciones');
    res.redirect(`/clients/${req.params.clientId}`);
  }
};

// Guardar nueva dirección (desde cliente)
exports.store = async (req, res) => {
  try {
    const { street, city, state, zipCode, country, reference, isMain } = req.body;
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }
    const address = new Address({
      client: client._id,
      street,
      city,
      state,
      zipCode,
      country,
      reference,
      isMain: isMain === 'on'
    });
    await address.save();
    client.addresses.push(address._id);
    await client.save();
    req.flash('success', 'Dirección agregada correctamente');
    res.redirect(`/clients/${client._id}`);
  } catch (error) {
    req.flash('error', 'Error al agregar dirección');
    res.redirect(`/clients/${req.params.clientId}`);
  }
};

// Eliminar dirección
exports.destroy = async (req, res) => {
  try {
    const address = await Address.findByIdAndDelete(req.params.addressId);
    if (!address) {
      req.flash('error', 'Dirección no encontrada');
      return res.redirect('/clients');
    }
    await Client.updateOne(
      { _id: address.client },
      { $pull: { addresses: address._id } }
    );
    req.flash('success', 'Dirección eliminada');
    res.redirect(`/clients/${req.params.clientId}`);
  } catch (error) {
    req.flash('error', 'Error al eliminar dirección');
    res.redirect(`/clients/${req.params.clientId}`);
  }
};