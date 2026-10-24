const checkPermission = (permission) => {
  return async (req, res, next) => {
    const user = req.session.user;
    if (!user) return res.redirect('/login');

    const Role = require('../models/Role');
    const role = await Role.findById(user.role);
    if (!role) {
      req.flash('error', 'Rol no válido');
      return res.redirect('/logout');
    }

    if (role.permissions.includes('*') || role.permissions.includes(permission)) {
      return next();
    }

    req.flash('error', 'Acceso denegado. No tienes permisos para esta acción.');
    res.status(403).redirect('/');
  };
};

module.exports = { checkPermission };