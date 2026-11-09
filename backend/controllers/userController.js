const User = require('../models/User');
const Role = require('../models/Role');

// ============================================================
// INDEX - Listar usuarios
// ============================================================
exports.index = async (req, res) => {
  try {
    const users = await User.find().populate('role').sort({ createdAt: -1 });
    res.render('users/index', {
      title: 'Usuarios',
      users
    });
  } catch (error) {
    console.error('❌ Error index usuarios:', error);
    req.flash('error', 'Error al obtener usuarios');
    res.redirect('/');
  }
};

// ============================================================
// CREATE - Formulario nuevo usuario
// ============================================================
exports.create = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.render('users/create', {
      title: 'Crear Usuario',
      roles
    });
  } catch (error) {
    console.error('❌ Error create usuario:', error);
    req.flash('error', 'Error al cargar roles');
    res.redirect('/users');
  }
};

// ============================================================
// STORE - Guardar nuevo usuario
// ============================================================
exports.store = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Validaciones básicas
    if (!name || !email || !password || !role) {
      req.flash('error', 'Todos los campos son obligatorios');
      return res.redirect('/users/create');
    }

    if (password.length < 6) {
      req.flash('error', 'La contraseña debe tener al menos 6 caracteres');
      return res.redirect('/users/create');
    }

    // Verificar email duplicado
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      req.flash('error', 'Ya existe un usuario con ese email');
      return res.redirect('/users/create');
    }

    // Crear usuario (el password se hashea en el pre('save') del modelo)
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true
    });

    await user.save();

    req.flash('success', `Usuario "${user.name}" creado correctamente`);
    return res.redirect('/users');
  } catch (error) {
    console.error('❌ Error store usuario:', error);
    req.flash('error', 'Error al crear usuario');
    return res.redirect('/users/create');
  }
};

// ============================================================
// EDIT - Formulario editar usuario
// ============================================================
exports.edit = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('role');
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/users');
    }

    const roles = await Role.find().sort({ name: 1 });

    res.render('users/edit', {
      title: 'Editar Usuario',
      user,
      roles
    });
  } catch (error) {
    console.error('❌ Error edit usuario:', error);
    req.flash('error', 'Usuario no encontrado');
    res.redirect('/users');
  }
};

// ============================================================
// UPDATE - Actualizar usuario (con soporte de contraseña opcional)
// ============================================================
exports.update = async (req, res) => {
  const { name, email, role, isActive, password, passwordConfirm } = req.body;

  try {
    // Buscar el usuario
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/users');
    }

    // Validaciones básicas
    if (!name || !email || !role) {
      req.flash('error', 'Nombre, email y rol son obligatorios');
      return res.redirect(`/users/${req.params.id}/edit`);
    }

    // Verificar email duplicado (excluyendo el usuario actual)
    const emailLower = email.toLowerCase().trim();
    if (emailLower !== user.email) {
      const exists = await User.findOne({
        email: emailLower,
        _id: { $ne: user._id }
      });
      if (exists) {
        req.flash('error', 'El email ya está en uso por otro usuario');
        return res.redirect(`/users/${req.params.id}/edit`);
      }
    }

    // Actualizar campos básicos
    user.name = name.trim();
    user.email = emailLower;
    user.role = role;
    user.isActive = isActive === 'on' || isActive === true || isActive === 'true';

    // 🔑 Cambio de contraseña SOLO si el usuario escribió algo
    const wantsPasswordChange =
      (password && password.trim() !== '') ||
      (passwordConfirm && passwordConfirm.trim() !== '');

    if (wantsPasswordChange) {
      // Validaciones
      if (!password || password.trim() === '') {
        req.flash('error', 'Debes escribir la nueva contraseña');
        return res.redirect(`/users/${req.params.id}/edit`);
      }
      if (password !== passwordConfirm) {
        req.flash('error', 'Las contraseñas no coinciden');
        return res.redirect(`/users/${req.params.id}/edit`);
      }
      if (password.length < 6) {
        req.flash('error', 'La contraseña debe tener al menos 6 caracteres');
        return res.redirect(`/users/${req.params.id}/edit`);
      }

      // Asignar nueva contraseña (el pre('save') la hashea)
      user.password = password;
    }

    await user.save();

    req.flash('success', `Usuario "${user.name}" actualizado correctamente`);
    return res.redirect('/users');
  } catch (error) {
    console.error('❌ Error update usuario:', error);
    req.flash('error', 'Error al actualizar el usuario');
    return res.redirect(`/users/${req.params.id}/edit`);
  }
};

// ============================================================
// DESTROY - Eliminar usuario
// ============================================================
exports.destroy = async (req, res) => {
  try {
    // Protección: no permitir autoeliminarse
    const currentUserId = req.session.user && (req.session.user._id || req.session.user.id);
    if (currentUserId && currentUserId.toString() === req.params.id) {
      req.flash('error', 'No puedes eliminar tu propio usuario');
      return res.redirect('/users');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/users');
    }

    await User.findByIdAndDelete(req.params.id);

    req.flash('success', `Usuario "${user.name}" eliminado correctamente`);
    return res.redirect('/users');
  } catch (error) {
    console.error('❌ Error destroy usuario:', error);
    req.flash('error', 'Error al eliminar usuario');
    return res.redirect('/users');
  }
};