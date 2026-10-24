const Project = require('../models/Project');
const Client = require('../models/Client');
// const Task = require('../models/Task');
// const InstalledEquipment = require('../models/InstalledEquipment');
// const Progress = require('../models/Progress');

exports.index = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('client', 'businessName')
      .populate('createdBy', 'name');
    res.render('projects/index', { title: 'Proyectos', projects });
  } catch (error) {
    req.flash('error', 'Error al cargar proyectos');
    res.redirect('/');
  }
};

exports.create = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true });
    res.render('projects/create', { title: 'Nuevo Proyecto', clients });
  } catch (error) {
    req.flash('error', 'Error al cargar datos');
    res.redirect('/projects');
  }
};

exports.store = async (req, res) => {
  try {
    const { name, client, description, startDate, endDate, budget } = req.body;
    await Project.create({
      name,
      client,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      budget: budget || 0,
      createdBy: req.session.user.id
    });
    req.flash('success', 'Proyecto creado correctamente');
    res.redirect('/projects');
  } catch (error) {
    req.flash('error', 'Error al crear proyecto');
    res.redirect('/projects/create');
  }
};

exports.show = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'businessName')
      .populate('createdBy', 'name');
    if (!project) {
      req.flash('error', 'Proyecto no encontrado');
      return res.redirect('/projects');
    }
    const tasks = await Task.find({ project: project._id });
    const equipments = await InstalledEquipment.find({ project: project._id }).populate('product', 'name code');
    const progresses = await Progress.find({ project: project._id }).sort({ date: -1 });
    res.render('projects/detail', { title: project.name, project, tasks, equipments, progresses });
  } catch (error) {
    req.flash('error', 'Error al cargar proyecto');
    res.redirect('/projects');
  }
};

exports.edit = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      req.flash('error', 'Proyecto no encontrado');
      return res.redirect('/projects');
    }
    const clients = await Client.find({ isActive: true });
    res.render('projects/edit', { title: 'Editar Proyecto', project, clients });
  } catch (error) {
    req.flash('error', 'Error al cargar proyecto');
    res.redirect('/projects');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, client, description, startDate, endDate, status, progress, budget } = req.body;
    await Project.findByIdAndUpdate(req.params.id, {
      name,
      client,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status,
      progress: progress || 0,
      budget: budget || 0
    });
    req.flash('success', 'Proyecto actualizado');
    res.redirect('/projects');
  } catch (error) {
    req.flash('error', 'Error al actualizar proyecto');
    res.redirect(`/projects/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    // Eliminar también tareas, equipos y avances asociados
    await Task.deleteMany({ project: req.params.id });
    await InstalledEquipment.deleteMany({ project: req.params.id });
    await Progress.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    req.flash('success', 'Proyecto eliminado');
    res.redirect('/projects');
  } catch (error) {
    req.flash('error', 'Error al eliminar proyecto');
    res.redirect('/projects');
  }
};

// Métodos para tareas, equipos y avances (anidados)
exports.storeTask = async (req, res) => {
  try {
    const { name, description, assignedTo, startDate, endDate } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      req.flash('error', 'Proyecto no encontrado');
      return res.redirect('/projects');
    }
    await Task.create({
      project: project._id,
      name,
      description,
      assignedTo,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.session.user.id
    });
    req.flash('success', 'Tarea agregada');
    res.redirect(`/projects/${project._id}`);
  } catch (error) {
    req.flash('error', 'Error al agregar tarea');
    res.redirect(`/projects/${req.params.id}`);
  }
};

exports.destroyTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.taskId);
    req.flash('success', 'Tarea eliminada');
    res.redirect(`/projects/${req.params.id}`);
  } catch (error) {
    req.flash('error', 'Error al eliminar tarea');
    res.redirect(`/projects/${req.params.id}`);
  }
};

exports.storeEquipment = async (req, res) => {
  try {
    const { product, serialNumber, installationDate, warranty } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      req.flash('error', 'Proyecto no encontrado');
      return res.redirect('/projects');
    }
    await InstalledEquipment.create({
      project: project._id,
      product,
      serialNumber,
      installationDate: new Date(installationDate),
      warranty: warranty ? new Date(warranty) : null,
      createdBy: req.session.user.id
    });
    req.flash('success', 'Equipo agregado');
    res.redirect(`/projects/${project._id}`);
  } catch (error) {
    req.flash('error', 'Error al agregar equipo');
    res.redirect(`/projects/${req.params.id}`);
  }
};

exports.destroyEquipment = async (req, res) => {
  try {
    await InstalledEquipment.findByIdAndDelete(req.params.equipmentId);
    req.flash('success', 'Equipo eliminado');
    res.redirect(`/projects/${req.params.id}`);
  } catch (error) {
    req.flash('error', 'Error al eliminar equipo');
    res.redirect(`/projects/${req.params.id}`);
  }
};

exports.storeProgress = async (req, res) => {
  try {
    const { description, percentage } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      req.flash('error', 'Proyecto no encontrado');
      return res.redirect('/projects');
    }
    await Progress.create({
      project: project._id,
      description,
      percentage: parseFloat(percentage),
      createdBy: req.session.user.id
    });
    // Actualizar progreso del proyecto (promedio o último registro)
    await Project.findByIdAndUpdate(project._id, { progress: parseFloat(percentage) });
    req.flash('success', 'Avance registrado');
    res.redirect(`/projects/${project._id}`);
  } catch (error) {
    req.flash('error', 'Error al registrar avance');
    res.redirect(`/projects/${req.params.id}`);
  }
};

exports.destroyProgress = async (req, res) => {
  try {
    await Progress.findByIdAndDelete(req.params.progressId);
    req.flash('success', 'Avance eliminado');
    res.redirect(`/projects/${req.params.id}`);
  } catch (error) {
    req.flash('error', 'Error al eliminar avance');
    res.redirect(`/projects/${req.params.id}`);
  }
};