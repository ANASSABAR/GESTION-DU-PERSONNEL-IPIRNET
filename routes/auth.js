const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = 'ipirnet-super-secret-key-2026';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const query = `
      SELECT u.*, CONCAT(p.nom, ' ', p.prenom) as nom_fonction 
      FROM FONCTION u
      JOIN PERSONNEL p ON u.id_personnel = p.id_personnel
      WHERE u.email = ? AND u.statut_compte = 'Actif'
    `;
    const [rows] = await db.query(query, [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects ou compte bloqué.' });
    }

    const user = rows[0];

    // Vérifier le mot de passe haché
    const isMatch = await bcrypt.compare(password, user.mot_de_passe);
    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.id_fonction, 
        email: user.email, 
        nom: user.nom_fonction, 
        id_personnel: user.id_personnel,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id_fonction,
        email: user.email,
        nom: user.nom_fonction,
        id_personnel: user.id_personnel,
        role: user.role
      }
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
