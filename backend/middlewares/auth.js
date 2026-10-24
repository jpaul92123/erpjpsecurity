// Verifica si el usuario está autenticado
const auth = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Debes iniciar sesión');
    return res.redirect('/login');
  }
  next();
};

// Redirige si ya está autenticado (para login/register)
const guest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
};

module.exports = { auth, guest };