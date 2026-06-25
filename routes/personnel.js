const router = require('express').Router();
const db = require('../db');
const { isValidDate, isOrderValid, validate } = require('./dateValidator');

const readOnlyRoles = ['Formateur', 'Secrétaire', 'Responsable pédagogique'];
function requireWrite(req, res, next) {
  if (req.user.role !== 'Administration') {
     return res.status(403).json({ error: 'Action refusée. Réservé à l\'Administration.' });
  }
  next();
}

const bcrypt = require('bcryptjs');

router.get('/', async (req, res) => {
  try {
    const q = req.query.q || '';
      const role = req.user.role;
      let query = '';
      let params = [];

      if (role === 'Administration') {
        query = `
          SELECT 
            p.id_personnel, p.nom, p.prenom, p.date_naissance, p.telephone, p.email, p.adresse,
            p.date_recrutement, p.statut, p.id_categorie, p.cin, p.sexe, p.contrat, p.num_cnss,
            c.libelle_categorie,
            COALESCE(rem.salaire_net, p.salaire_base) AS salaire_base,
            COALESCE(rem.prime, p.prime) AS prime,
            COALESCE(hs.total_heures, 0) AS heures_supp
          FROM PERSONNEL p
          LEFT JOIN CATEGORIE c ON p.id_categorie = c.id_categorie
          LEFT JOIN (
            SELECT r1.id_personnel, r1.salaire_net, r1.prime FROM remuneration r1
            WHERE r1.id_remuneration = (SELECT MAX(r2.id_remuneration) FROM remuneration r2 WHERE r2.id_personnel = r1.id_personnel)
          ) rem ON p.id_personnel = rem.id_personnel
          LEFT JOIN (
            SELECT id_personnel, SUM(nombre_heures) AS total_heures FROM heure_supplementaire GROUP BY id_personnel
          ) hs ON p.id_personnel = hs.id_personnel
          WHERE (CONCAT(p.nom, ' ', p.prenom) LIKE ? OR p.email LIKE ?)
          ORDER BY p.nom`;
        params.push(`%${q}%`, `%${q}%`);
      } else if (role === 'Secrétaire' || role === 'Responsable pédagogique') {
        query = `
          SELECT p.id_personnel, p.nom, p.prenom, p.statut, p.id_categorie, c.libelle_categorie
          FROM PERSONNEL p
          LEFT JOIN CATEGORIE c ON p.id_categorie = c.id_categorie
          WHERE CONCAT(p.nom, ' ', p.prenom) LIKE ?
          ORDER BY p.nom`;
        params.push(`%${q}%`);
      } else {
        query = `
          SELECT 
            p.id_personnel, p.nom, p.prenom, p.date_naissance, p.telephone, p.email, p.adresse,
            p.date_recrutement, p.statut, p.id_categorie, p.cin, p.sexe, p.contrat, p.num_cnss,
            c.libelle_categorie,
            p.salaire_base, p.prime, 0 AS heures_supp
          FROM PERSONNEL p
          LEFT JOIN CATEGORIE c ON p.id_categorie = c.id_categorie
          WHERE p.id_personnel = ?`;
        params.push(req.user.id_personnel);
      }

      const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
      if (req.user.role !== 'Administration' && parseInt(req.params.id) !== req.user.id_personnel) {
        return res.status(403).json({ error: 'Accès interdit aux données de ce profil.' });
      }

      const [rows] = await db.query(`
        SELECT 
          p.id_personnel, p.nom, p.prenom, p.date_naissance, p.telephone, p.email, p.adresse,
          p.date_recrutement, p.statut, p.id_categorie, p.cin, p.sexe, p.contrat, p.num_cnss,
          c.libelle_categorie,
          COALESCE(rem.salaire_net, p.salaire_base) AS salaire_base,
          COALESCE(rem.prime, p.prime) AS prime,
          COALESCE(hs.total_heures, 0) AS heures_supp
        FROM PERSONNEL p
        LEFT JOIN CATEGORIE c ON p.id_categorie = c.id_categorie
        LEFT JOIN (
          SELECT r1.id_personnel, r1.salaire_net, r1.prime FROM remuneration r1
          WHERE r1.id_remuneration = (SELECT MAX(r2.id_remuneration) FROM remuneration r2 WHERE r2.id_personnel = r1.id_personnel)
        ) rem ON p.id_personnel = rem.id_personnel
        LEFT JOIN (
          SELECT id_personnel, SUM(nombre_heures) AS total_heures FROM heure_supplementaire GROUP BY id_personnel
        ) hs ON p.id_personnel = hs.id_personnel
        WHERE p.id_personnel = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Personnel introuvable' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireWrite, async (req, res) => {
  try {
    const d = req.body;
    
    // Strict validation for email and CIN
    if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
      return res.status(400).json({ error: 'Un email valide est obligatoire.' });
    }
    if (!d.cin || d.cin.trim() === '') {
      return res.status(400).json({ error: 'La CIN est obligatoire.' });
    }

    const err = validate([
      isValidDate(d.date_naissance,   { label: 'Date de naissance',   minYear: 1950, maxYear: 2025, notFuture: true }),
      isValidDate(d.date_recrutement, { label: 'Date de recrutement', minYear: 2000, maxYear: 2099, notFuture: true }),
      isOrderValid(d.date_naissance, d.date_recrutement, 'Date de naissance', 'Date de recrutement'),
    ]);
    if (err) return res.status(400).json({ error: err });
    if (d.contrat && !['CDI', 'CDD', 'STAGE', 'INTERIM'].includes(d.contrat)) {
      return res.status(400).json({ error: 'Type de contrat invalide.' });
    }

    // Insert into PERSONNEL
    const [result] = await db.query(
      'INSERT INTO PERSONNEL (nom, prenom, date_naissance, telephone, email, adresse, date_recrutement, salaire_base, prime, statut, id_categorie, cin, sexe, contrat, num_cnss) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [d.nom, d.prenom, d.date_naissance, d.telephone, d.email, d.adresse, d.date_recrutement, d.salaire_base, d.prime, d.statut, d.id_categorie, d.cin, d.sexe, d.contrat, d.num_cnss || null]);
      
    const newId = result.insertId;

    // Get role from CATEGORIE
    const [catRows] = await db.query('SELECT libelle_categorie FROM CATEGORIE WHERE id_categorie = ?', [d.id_categorie]);
    const role = catRows.length > 0 ? catRows[0].libelle_categorie : 'Inconnu';

    // Auto-create user account
    const hashedPassword = await bcrypt.hash(d.cin, 10);
    
    await db.query(`
      INSERT INTO FONCTION (id_personnel, email, mot_de_passe, role, statut_compte)
      VALUES (?, ?, ?, ?, 'Actif')
    `, [newId, d.email, hashedPassword, role]);

    res.json({ success: true, insertedId: newId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireWrite, async (req, res) => {
  try {
    const d = req.body;
    
    // Strict validation for email and CIN
    if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
      return res.status(400).json({ error: 'Un email valide est obligatoire.' });
    }
    if (!d.cin || d.cin.trim() === '') {
      return res.status(400).json({ error: 'La CIN est obligatoire.' });
    }

    const err = validate([
      isValidDate(d.date_naissance,   { label: 'Date de naissance',   minYear: 1950, maxYear: 2025, notFuture: true }),
      isValidDate(d.date_recrutement, { label: 'Date de recrutement', minYear: 2000, maxYear: 2099, notFuture: true }),
      isOrderValid(d.date_naissance, d.date_recrutement, 'Date de naissance', 'Date de recrutement'),
    ]);
    if (err) return res.status(400).json({ error: err });
    if (d.contrat && !['CDI', 'CDD', 'STAGE', 'INTERIM'].includes(d.contrat)) {
      return res.status(400).json({ error: 'Type de contrat invalide.' });
    }

    // Check old email, CIN, and categorie to see if they changed
    const [oldRows] = await db.query('SELECT email, cin, id_categorie FROM PERSONNEL WHERE id_personnel = ?', [req.params.id]);
    
    await db.query(
      'UPDATE PERSONNEL SET nom=?, prenom=?, date_naissance=?, telephone=?, email=?, adresse=?, date_recrutement=?, salaire_base=?, prime=?, statut=?, id_categorie=?, cin=?, sexe=?, contrat=?, num_cnss=? WHERE id_personnel=?',
      [d.nom, d.prenom, d.date_naissance, d.telephone, d.email, d.adresse, d.date_recrutement, d.salaire_base, d.prime, d.statut, d.id_categorie, d.cin, d.sexe, d.contrat, d.num_cnss || null, req.params.id]);

    // Update FONCTION if necessary
    if (oldRows.length > 0) {
        const old = oldRows[0];
        let role = null;
        
        // Fetch new role if category changed
        if (String(old.id_categorie) !== String(d.id_categorie)) {
            const [catRows] = await db.query('SELECT libelle_categorie FROM CATEGORIE WHERE id_categorie = ?', [d.id_categorie]);
            if (catRows.length > 0) role = catRows[0].libelle_categorie;
        }

        if (old.email !== d.email || old.cin !== d.cin || role !== null) {
            let updateQuery = 'UPDATE FONCTION SET email = ?';
            let updateParams = [d.email];

            if (old.cin !== d.cin) {
                const hashedNewPwd = await bcrypt.hash(d.cin, 10);
                updateQuery += ', mot_de_passe = ?';
                updateParams.push(hashedNewPwd);
            }
            if (role !== null) {
                updateQuery += ', role = ?';
                updateParams.push(role);
            }
            
            updateQuery += ' WHERE id_personnel = ?';
            updateParams.push(req.params.id);

            await db.query(updateQuery, updateParams);
        }
    }

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireWrite, async (req, res) => {
  try {
    // Delete user first, just to be sure (cascade should handle it normally)
    await db.query('DELETE FROM FONCTION WHERE id_personnel=?', [req.params.id]);
    await db.query('DELETE FROM PERSONNEL WHERE id_personnel=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
