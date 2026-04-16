function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) return next();
  req.flash('error', 'Você precisa estar logado para acessar essa página.');
  res.redirect('/auth/login');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.userRole === 'ADMIN') return next();
  req.flash('error', 'Acesso restrito a administradores.');
  res.redirect('/');
}

function isOwnerOrAdmin(req, res, next) {
  
  next();
}

module.exports = { isAuthenticated, isAdmin, isOwnerOrAdmin };
