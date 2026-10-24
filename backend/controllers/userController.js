const User = require('../models/User');
const Role = require('../models/Role');

exports.index = async (req, res) => {
  try {
    const users = await User.find().populate('role');
    res.render('users/index', { title: 'Usuarios', users });
  } catch (error) {
    req.flash('error', 'Error al obtener usuarios');
    res.redirect('/');
  }
};

exports.create = async (req, res) => {
  try {
    const roles = await Role.find();
    res.render('users/create', { title: 'Crear Usuario', roles });
  } catch (error) {
    req.flash('error', 'Error al cargar roles');
    res.redirect('/users');
  }
};

exports.store = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const user = new User({ name, email, password, role });
    await user.save();
    req.flash('success', 'Usuario creado');
    res.redirect('/users');
  } catch (error) {
    req.flash('error', 'Error al crear usuario');
    res.redirect('/users/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const roles = await Role.find();
    res.render('users/edit', { title: 'Editar Usuario', user, roles });
  } catch (error) {
    req.flash('error', 'Usuario no encontrado');
    res.redirect('/users');
  }
};

exports.update = async (req, res) => {
  const { name, email, role, isActive } = req.body;
  try {
    await User.findByIdAndUpdate(req.params.id, { 
      name, 
      email, 
      role, 
      isActive: isActive === 'on' 
    });
    req.flash('success', 'Usuario actualizado');
    res.redirect('/users');
  } catch (error) {
    req.flash('error', 'Error al actualizar');
    res.redirect(`/users/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'Usuario eliminado');
    res.redirect('/users');
  } catch (error) {
    req.flash('error', 'Error al eliminar');
    res.redirect('/users');
  }
};