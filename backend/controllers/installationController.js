const Installation = require('../models/Installation');
const Client = require('../models/Client');
const Project = require('../models/Project');

exports.index = async (req, res) => {
  try {
    const installations = await Installation.find()
      .populate('client', 'businessName')
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .sort({ installationDate: -1 });
    res.render('installations/index', { title: 'Instalaciones', installations });
  } catch (error) {
    req.flash('error', 'Error al cargar instalaciones');
    res.redirect('/');
  }
};

exports.create = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true });
    const projects = await Project.find({ status: { $ne: 'Completado' } });
    res.render('installations/create', { title: 'Nueva Instalación', clients, projects });
  } catch (error) {
    req.flash('error', 'Error al cargar datos');
    res.redirect('/installations');
  }
};

exports.store = async (req, res) => {
  try {
    const { client, project, equipment, serialNumber, installationDate, technician, notes } = req.body;
    await Installation.create({
      client,
      project: project || null,
      equipment,
      serialNumber,
      installationDate: new Date(installationDate),
      technician,
      notes: notes || '',
      createdBy: req.session.user.id
    });
    req.flash('success', 'Instalación registrada correctamente');
    res.redirect('/installations');
  } catch (error) {
    req.flash('error', 'Error al registrar instalación: ' + error.message);
    res.redirect('/installations/create');
  }
};

exports.show = async (req, res) => {
  try {
    const installation = await Installation.findById(req.params.id)
      .populate('client', 'businessName ruc email phone')
      .populate('project', 'name')
      .populate('createdBy', 'name');
    if (!installation) {
      req.flash('error', 'Instalación no encontrada');
      return res.redirect('/installations');
    }
    res.render('installations/detail', { title: 'Detalle Instalación', installation });
  } catch (error) {
    req.flash('error', 'Error al cargar instalación');
    res.redirect('/installations');
  }
};

exports.edit = async (req, res) => {
  try {
    const installation = await Installation.findById(req.params.id);
    if (!installation) {
      req.flash('error', 'Instalación no encontrada');
      return res.redirect('/installations');
    }
    const clients = await Client.find({ isActive: true });
    const projects = await Project.find({ status: { $ne: 'Completado' } });
    res.render('installations/edit', { title: 'Editar Instalación', installation, clients, projects });
  } catch (error) {
    req.flash('error', 'Error al cargar instalación');
    res.redirect('/installations');
  }
};

exports.update = async (req, res) => {
  try {
    const { client, project, equipment, serialNumber, installationDate, technician, status, notes } = req.body;
    await Installation.findByIdAndUpdate(req.params.id, {
      client,
      project: project || null,
      equipment,
      serialNumber,
      installationDate: new Date(installationDate),
      technician,
      status,
      notes: notes || ''
    });
    req.flash('success', 'Instalación actualizada');
    res.redirect('/installations');
  } catch (error) {
    req.flash('error', 'Error al actualizar instalación');
    res.redirect(`/installations/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    await Installation.findByIdAndDelete(req.params.id);
    req.flash('success', 'Instalación eliminada');
    res.redirect('/installations');
  } catch (error) {
    req.flash('error', 'Error al eliminar instalación');
    res.redirect('/installations');
  }
};