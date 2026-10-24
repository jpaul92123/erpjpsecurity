const Visit = require('../models/Visit');
const Client = require('../models/Client');

exports.index = async (req, res) => {
  try {
    const visits = await Visit.find()
      .populate('client', 'businessName')
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    res.render('visits/index', { title: 'Visitas Técnicas', visits });
  } catch (error) {
    req.flash('error', 'Error al cargar visitas');
    res.redirect('/');
  }
};

exports.create = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true });
    res.render('visits/create', { title: 'Nueva Visita', clients });
  } catch (error) {
    req.flash('error', 'Error al cargar datos');
    res.redirect('/visits');
  }
};

exports.store = async (req, res) => {
  try {
    const { client, technician, date, purpose, description } = req.body;
    await Visit.create({
      client,
      technician,
      date: new Date(date),
      purpose,
      description: description || '',
      createdBy: req.session.user.id
    });
    req.flash('success', 'Visita registrada correctamente');
    res.redirect('/visits');
  } catch (error) {
    req.flash('error', 'Error al registrar visita: ' + error.message);
    res.redirect('/visits/create');
  }
};

exports.show = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('client', 'businessName ruc email phone')
      .populate('createdBy', 'name');
    if (!visit) {
      req.flash('error', 'Visita no encontrada');
      return res.redirect('/visits');
    }
    res.render('visits/detail', { title: 'Detalle Visita', visit });
  } catch (error) {
    req.flash('error', 'Error al cargar visita');
    res.redirect('/visits');
  }
};

exports.edit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      req.flash('error', 'Visita no encontrada');
      return res.redirect('/visits');
    }
    const clients = await Client.find({ isActive: true });
    res.render('visits/edit', { title: 'Editar Visita', visit, clients });
  } catch (error) {
    req.flash('error', 'Error al cargar visita');
    res.redirect('/visits');
  }
};

exports.update = async (req, res) => {
  try {
    const { client, technician, date, purpose, status, description } = req.body;
    await Visit.findByIdAndUpdate(req.params.id, {
      client,
      technician,
      date: new Date(date),
      purpose,
      status,
      description: description || ''
    });
    req.flash('success', 'Visita actualizada');
    res.redirect('/visits');
  } catch (error) {
    req.flash('error', 'Error al actualizar visita');
    res.redirect(`/visits/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    await Visit.findByIdAndDelete(req.params.id);
    req.flash('success', 'Visita eliminada');
    res.redirect('/visits');
  } catch (error) {
    req.flash('error', 'Error al eliminar visita');
    res.redirect('/visits');
  }
};