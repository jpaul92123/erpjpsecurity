const Contact = require('../models/Contact');
const Client = require('../models/Client');

// Mostrar contactos de un cliente
exports.index = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }
    const contacts = await Contact.find({ client: req.params.clientId });
    res.render('contacts/index', { title: 'Contactos', client, contacts });
  } catch (error) {
    req.flash('error', 'Error al cargar contactos');
    res.redirect(`/clients/${req.params.clientId}`);
  }
};

// Guardar nuevo contacto (desde cliente)
exports.store = async (req, res) => {
  try {
    const { name, position, email, phone, isMain } = req.body;
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      req.flash('error', 'Cliente no encontrado');
      return res.redirect('/clients');
    }
    const contact = new Contact({
      client: client._id,
      name,
      position,
      email,
      phone,
      isMain: isMain === 'on'
    });
    await contact.save();
    client.contacts.push(contact._id);
    await client.save();
    req.flash('success', 'Contacto agregado correctamente');
    res.redirect(`/clients/${client._id}`);
  } catch (error) {
    req.flash('error', 'Error al agregar contacto');
    res.redirect(`/clients/${req.params.clientId}`);
  }
};

// Eliminar contacto
exports.destroy = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.contactId);
    if (!contact) {
      req.flash('error', 'Contacto no encontrado');
      return res.redirect('/clients');
    }
    await Client.updateOne(
      { _id: contact.client },
      { $pull: { contacts: contact._id } }
    );
    req.flash('success', 'Contacto eliminado');
    res.redirect(`/clients/${req.params.clientId}`);
  } catch (error) {
    req.flash('error', 'Error al eliminar contacto');
    res.redirect(`/clients/${req.params.clientId}`);
  }
};