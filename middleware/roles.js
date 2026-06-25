module.exports = function(allowedRoles) {
  return function(req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Accès refusé. Rôle non défini.' });
    }
    
    // Administration a toujours accès
    if (req.user.role === 'Administration') {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Accès refusé. Vous n\'avez pas la permission d\'effectuer cette action.' });
  }
};
