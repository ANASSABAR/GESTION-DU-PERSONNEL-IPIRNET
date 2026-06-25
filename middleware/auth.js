const jwt = require('jsonwebtoken');
const JWT_SECRET = 'ipirnet-super-secret-key-2026';

module.exports = function(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Token invalide.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token expiré ou invalide.' });
  }
};
