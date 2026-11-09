const User = require('../models/User');
const Role = require('../models/Role');

// ============================================================
// LOGIN
// ============================================================
exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Iniciar Sesión' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 🔑 Populate role para obtener el nombre del rol
    const user = await User.findOne({ email }).populate('role');

    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/login');
    }

    if (!user.isActive) {
      req.flash('error', 'Usuario inactivo');
      return res.redirect('/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Contraseña incorrecta');
      return res.redirect('/login');
    }

    // 🔑 Guardar en sesión CON roleName y permissions
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role ? user.role._id : null,
      roleName: user.role ? user.role.name : 'user',
      permissions: user.role && user.role.permissions ? user.role.permissions : []
    };

    console.log('✅ Login OK:', user.email, '| Rol:', req.session.user.roleName);

    req.flash('success', `Bienvenido ${user.name}`);
    return res.redirect('/');
  } catch (error) {
    console.error('❌ Error en login:', error);
    req.flash('error', 'Error en el servidor');
    return res.redirect('/login');
  }
};

// ============================================================
// REGISTER
// ============================================================
exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Registro' });
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let role = await Role.findOne({ name: 'user' });
    if (!role) {
      // Crear roles por defecto si no existen
      await Role.create({ name: 'admin', permissions: ['*'] });
      role = await Role.create({ name: 'user', permissions: ['ventas', 'servicios'] });
    }

    const user = new User({ name, email, password, role: role._id });
    await user.save();

    req.flash('success', 'Usuario registrado. Ahora inicia sesión');
    return res.redirect('/login');
  } catch (error) {
    console.error('❌ Error en register:', error);
    req.flash('error', 'Error al registrar');
    return res.redirect('/register');
  }
};

// ============================================================
// LOGOUT
// ============================================================
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Error al destruir sesión:', err);
    res.redirect('/login');
  });
};