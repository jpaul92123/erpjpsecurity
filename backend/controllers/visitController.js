const Visit = require('../models/Visit');
const Client = require('../models/Client');

// ============================================================
// LISTADO
// ============================================================
exports.index = async (req, res) => {
  try {
    const visits = await Visit.find()
      .populate('client', 'businessName')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.render('visits/index', { 
      title: 'Visitas Técnicas', 
      visits 
    });
  } catch (error) {
    console.error('❌ Error index visitas:', error);
    req.flash('error', 'Error al cargar visitas');
    res.redirect('/');
  }
};

// ============================================================
// CREAR (formulario)
// ============================================================
exports.create = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true });
    res.render('visits/create', { 
      title: 'Nueva Visita', 
      clients 
    });
  } catch (error) {
    console.error('❌ Error create visita:', error);
    req.flash('error', 'Error al cargar datos');
    res.redirect('/visits');
  }
};

// ============================================================
// GUARDAR
// ============================================================
exports.store = async (req, res) => {
  try {
    const { client, technician, date, purpose, description } = req.body;

    // 🔑 Tomar el ID del usuario logueado correctamente
    const userId = req.session.user._id || req.session.user.id;

    await Visit.create({
      client,
      technician,
      date: new Date(date),
      purpose,
      description: description || '',
      createdBy: userId // <-- Corregido
    });

    req.flash('success', 'Visita registrada correctamente');
    res.redirect('/visits');
  } catch (error) {
    console.error('❌ Error store visita:', error);
    req.flash('error', 'Error al registrar visita: ' + error.message);
    res.redirect('/visits/create');
  }
};

// ============================================================
// MOSTRAR DETALLE
// ============================================================
exports.show = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('client', 'businessName ruc email phone')
      .populate('createdBy', 'name');

    if (!visit) {
      req.flash('error', 'Visita no encontrada');
      return res.redirect('/visits');
    }

    res.render('visits/detail', { 
      title: 'Detalle Visita', 
      visit 
    });
  } catch (error) {
    console.error('❌ Error show visita:', error);
    req.flash('error', 'Error al cargar visita');
    res.redirect('/visits');
  }
};

// ============================================================
// EDITAR (formulario)
// ============================================================
exports.edit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      req.flash('error', 'Visita no encontrada');
      return res.redirect('/visits');
    }

    const clients = await Client.find({ isActive: true });

    res.render('visits/edit', { 
      title: 'Editar Visita', 
      visit, 
      clients 
    });
  } catch (error) {
    console.error('❌ Error edit visita:', error);
    req.flash('error', 'Error al cargar visita');
    res.redirect('/visits');
  }
};

// ============================================================
// ACTUALIZAR
// ============================================================
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
    console.error('❌ Error update visita:', error);
    req.flash('error', 'Error al actualizar visita');
    res.redirect(`/visits/${req.params.id}/edit`);
  }
};

// ============================================================
// ELIMINAR
// ============================================================
exports.destroy = async (req, res) => {
  try {
    await Visit.findByIdAndDelete(req.params.id);
    req.flash('success', 'Visita eliminada');
    res.redirect('/visits');
  } catch (error) {
    console.error('❌ Error destroy visita:', error);
    req.flash('error', 'Error al eliminar visita');
    res.redirect('/visits');
  }
};