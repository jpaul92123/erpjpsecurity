const WorkOrder = require('../models/WorkOrder');
const Client = require('../models/Client');
const Project = require('../models/Project');

// ============================================
// LISTADO
// ============================================
exports.index = async (req, res) => {
  try {
    const workOrders = await WorkOrder.find()
      .populate('client', 'businessName')
      .populate('project', 'name')
      .populate('createdBy', 'name');
    res.render('work-orders/index', {
      title: 'Órdenes de Trabajo',
      workOrders
    });
  } catch (error) {
    console.error('Error index WorkOrder:', error);
    req.flash('error', 'Error al cargar órdenes de trabajo');
    res.redirect('/');
  }
};

// ============================================
// FORM CREAR
// ============================================
exports.create = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true });
    const projects = await Project.find({ status: { $ne: 'Completado' } });
    res.render('work-orders/create', {
      title: 'Nueva Orden de Trabajo',
      clients,
      projects
    });
  } catch (error) {
    console.error('Error create WorkOrder:', error);
    req.flash('error', 'Error al cargar datos');
    res.redirect('/work-orders');
  }
};

// ============================================
// GUARDAR
// ============================================
exports.store = async (req, res) => {
  try {
    const {
      client, project, description, priority,
      assignedTo, startDate, endDate, notes
    } = req.body;

    await WorkOrder.create({
      client,
      project: project || null,
      description,
      priority,
      assignedTo,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes,
      createdBy: req.session.user.id
    });

    req.flash('success', 'Orden de trabajo creada correctamente');
    res.redirect('/work-orders');
  } catch (error) {
    console.error('Error store WorkOrder:', error);
    req.flash('error', 'Error al crear orden de trabajo');
    res.redirect('/work-orders/create');
  }
};

// ============================================
// DETALLE
// ============================================
exports.show = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('client', 'businessName')
      .populate('project', 'name')
      .populate('createdBy', 'name');

    if (!workOrder) {
      req.flash('error', 'Orden de trabajo no encontrada');
      return res.redirect('/work-orders');
    }

    res.render('work-orders/detail', {
      title: `OT ${workOrder.number}`,
      workOrder
    });
  } catch (error) {
    console.error('Error show WorkOrder:', error);
    req.flash('error', 'Error al cargar orden de trabajo');
    res.redirect('/work-orders');
  }
};

// ============================================
// FORM EDITAR
// ============================================
exports.edit = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      req.flash('error', 'Orden de trabajo no encontrada');
      return res.redirect('/work-orders');
    }

    const clients = await Client.find({ isActive: true });
    const projects = await Project.find({ status: { $ne: 'Completado' } });

    res.render('work-orders/edit', {
      title: 'Editar Orden de Trabajo',
      workOrder,
      clients,
      projects
    });
  } catch (error) {
    console.error('Error edit WorkOrder:', error);
    req.flash('error', 'Error al cargar orden de trabajo');
    res.redirect('/work-orders');
  }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.update = async (req, res) => {
  try {
    const {
      client, project, description, priority,
      assignedTo, startDate, endDate, status, notes
    } = req.body;

    await WorkOrder.findByIdAndUpdate(req.params.id, {
      client,
      project: project || null,
      description,
      priority,
      assignedTo,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status,
      notes
    });

    req.flash('success', 'Orden de trabajo actualizada');
    res.redirect('/work-orders');
  } catch (error) {
    console.error('Error update WorkOrder:', error);
    req.flash('error', 'Error al actualizar orden de trabajo');
    res.redirect(`/work-orders/${req.params.id}/edit`);
  }
};

// ============================================
// ELIMINAR
// ============================================
exports.destroy = async (req, res) => {
  try {
    await WorkOrder.findByIdAndDelete(req.params.id);
    req.flash('success', 'Orden de trabajo eliminada');
    res.redirect('/work-orders');
  } catch (error) {
    console.error('Error destroy WorkOrder:', error);
    req.flash('error', 'Error al eliminar orden de trabajo');
    res.redirect('/work-orders');
  }
};