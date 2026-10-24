const User = require('../models/User');
const Role = require('../models/Role');

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Iniciar Sesión' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
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
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    req.flash('success', `Bienvenido ${user.name}`);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error en el servidor');
    res.redirect('/login');
  }
};

exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Registro' });
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let role = await Role.findOne({ name: 'user' });
    if (!role) {
      // Crear roles por defecto si no existen
      const adminRole = await Role.create({ name: 'admin', permissions: ['*'] });
      role = await Role.create({ name: 'user', permissions: ['view_dashboard'] });
    }
    const user = new User({ name, email, password, role: role._id });
    await user.save();
    req.flash('success', 'Usuario registrado. Ahora inicia sesión');
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al registrar');
    res.redirect('/register');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/login');
  });
};