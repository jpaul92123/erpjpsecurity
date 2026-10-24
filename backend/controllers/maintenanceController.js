const Maintenance = require('../models/Maintenance');
const Client = require('../models/Client');

exports.index = async (req, res) => {
  try {
    const maintenances = await Maintenance.find()
      .populate('client', 'businessName')
      .populate('createdBy', 'name')
      .sort({ scheduledDate: -1 });
    res.render('maintenances/index', { title: 'Mantenimientos', maintenances });
  } catch (error) {
    req.flash('error', 'Error al cargar mantenimientos');
    res.redirect('/');
  }
};

exports.create = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true });
    res.render('maintenances/create', { title: 'Nuevo Mantenimiento', clients });
  } catch (error) {
    req.flash('error', 'Error al cargar datos');
    res.redirect('/maintenances');
  }
};

exports.store = async (req, res) => {
  try {
    const { client, equipment, serialNumber, type, scheduledDate, technician, description, cost } = req.body;
    await Maintenance.create({
      client,
      equipment,
      serialNumber,
      type,
      scheduledDate: new Date(scheduledDate),
      technician,
      description: description || '',
      cost: parseFloat(cost) || 0,
      createdBy: req.session.user.id
    });
    req.flash('success', 'Mantenimiento registrado correctamente');
    res.redirect('/maintenances');
  } catch (error) {
    req.flash('error', 'Error al registrar mantenimiento: ' + error.message);
    res.redirect('/maintenances/create');
  }
};

exports.show = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('client', 'businessName ruc email phone')
      .populate('createdBy', 'name');
    if (!maintenance) {
      req.flash('error', 'Mantenimiento no encontrado');
      return res.redirect('/maintenances');
    }
    res.render('maintenances/detail', { title: 'Detalle Mantenimiento', maintenance });
  } catch (error) {
    req.flash('error', 'Error al cargar mantenimiento');
    res.redirect('/maintenances');
  }
};

exports.edit = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      req.flash('error', 'Mantenimiento no encontrado');
      return res.redirect('/maintenances');
    }
    const clients = await Client.find({ isActive: true });
    res.render('maintenances/edit', { title: 'Editar Mantenimiento', maintenance, clients });
  } catch (error) {
    req.flash('error', 'Error al cargar mantenimiento');
    res.redirect('/maintenances');
  }
};

exports.update = async (req, res) => {
  try {
    const { client, equipment, serialNumber, type, scheduledDate, completionDate, technician, status, description, cost } = req.body;
    await Maintenance.findByIdAndUpdate(req.params.id, {
      client,
      equipment,
      serialNumber,
      type,
      scheduledDate: new Date(scheduledDate),
      completionDate: completionDate ? new Date(completionDate) : null,
      technician,
      status,
      description: description || '',
      cost: parseFloat(cost) || 0
    });
    req.flash('success', 'Mantenimiento actualizado');
    res.redirect('/maintenances');
  } catch (error) {
    req.flash('error', 'Error al actualizar mantenimiento');
    res.redirect(`/maintenances/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    req.flash('success', 'Mantenimiento eliminado');
    res.redirect('/maintenances');
  } catch (error) {
    req.flash('error', 'Error al eliminar mantenimiento');
    res.redirect('/maintenances');
  }
};