// En tu controlador de login (POST /login)
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 🔑 Populate role para obtener el nombre
    const user = await User.findOne({ email }).populate('role');
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash('error', 'Credenciales inválidas');
      return res.redirect('/login');
    }
    
    if (!user.isActive) {
      req.flash('error', 'Usuario desactivado');
      return res.redirect('/login');
    }
    
    // 🔑 Guardar datos en sesión INCLUYENDO roleName
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role ? user.role._id : null,       // ⬅️ ObjectId (ya lo tenías)
      roleName: user.role ? user.role.name : null   // ⬅️ NUEVO: nombre del rol
    };
    
    req.flash('success', 'Bienvenido ' + user.name);
    return res.redirect('/');
  } catch (err) {
    console.error('Error en login:', err);
    req.flash('error', 'Error al iniciar sesión');
    return res.redirect('/login');
  }
});