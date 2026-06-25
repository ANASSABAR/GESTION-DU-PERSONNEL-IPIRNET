const router = require('express').Router();
const db = require('../db');
const { isValidDate, validate } = require('./dateValidator');
const { syncPersonnelMetrics } = require('./syncHelper');

function requireWrite(req, res, next) {
  if (req.user.role !== 'Administration') {
    return res.status(403).json({ error: 'Action refusée. Réservé à l\'Administration.' });
  }
  next();
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT h.id_heure_sup, h.date, h.nombre_heures, h.motif, h.id_personnel, CONCAT(p.nom, ' ', p.prenom) AS nom_complet, p.contrat,
        CASE
          WHEN p.contrat='CDI' THEN 25
          WHEN p.contrat='CDD' THEN 20
          WHEN p.contrat='STAGE' THEN 0
          WHEN p.contrat='INTERIM' THEN 0
          ELSE 0
        END AS prix_heure
      FROM heure_supplementaire h JOIN personnel p ON h.id_personnel = p.id_personnel
      ORDER BY h.date DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        h.id_heure_sup, h.date, h.nombre_heures, h.motif, h.id_personnel, 
        p.nom, 
        p.prenom, 
        p.statut,
        p.contrat,
        CONCAT(p.nom, ' ', p.prenom) AS nom_complet,
        CASE
          WHEN p.contrat='CDI' THEN 25
          WHEN p.contrat='CDD' THEN 20
          WHEN p.contrat='STAGE' THEN 0
          WHEN p.contrat='INTERIM' THEN 0
          ELSE 0
        END AS prix_heure
      FROM heure_supplementaire h
      JOIN personnel p ON h.id_personnel = p.id_personnel
      WHERE h.id_heure_sup = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Heure supplémentaire introuvable' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireWrite, async (req, res) => {
  try {
    const d = req.body;
    const err = validate([
      isValidDate(d.date, { label: 'Date', minYear: 2000, maxYear: 2099, notFuture: true }),
    ]);
    if (err) return res.status(400).json({ error: err });

    // Check contract type
    const [pRows] = await db.query('SELECT contrat FROM personnel WHERE id_personnel = ?', [d.id_personnel]);
    if (pRows.length > 0 && ['STAGE', 'INTERIM'].includes(pRows[0].contrat)) {
      return res.status(400).json({ error: "Les stagiaires et les intérimaires ne sont pas autorisés à effectuer des heures supplémentaires." });
    }

    await db.query(
      'INSERT INTO heure_supplementaire (date, nombre_heures, prix_heure, motif, id_personnel) VALUES (?,?,?,?,?)',
      [d.date, d.nombre_heures, d.prix_heure || 0, d.motif, d.id_personnel]);

    // Sync metrics for this employee
    await syncPersonnelMetrics(d.id_personnel);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireWrite, async (req, res) => {
  try {
    const d = req.body;
    const err = validate([
      isValidDate(d.date, { label: 'Date', minYear: 2000, maxYear: 2099, notFuture: true }),
    ]);
    if (err) return res.status(400).json({ error: err });

    // Check contract type
    const [pRows] = await db.query('SELECT contrat FROM personnel WHERE id_personnel = ?', [d.id_personnel]);
    if (pRows.length > 0 && ['STAGE', 'INTERIM'].includes(pRows[0].contrat)) {
      return res.status(400).json({ error: "Les stagiaires et les intérimaires ne sont pas autorisés à effectuer des heures supplémentaires." });
    }

    // Fetch old id_personnel for sync
    const [oldRows] = await db.query('SELECT id_personnel FROM heure_supplementaire WHERE id_heure_sup = ?', [req.params.id]);
    const oldId = oldRows.length ? oldRows[0].id_personnel : null;

    await db.query(
      'UPDATE heure_supplementaire SET date=?, nombre_heures=?, motif=?, id_personnel=? WHERE id_heure_sup=?',
      [d.date, d.nombre_heures, d.motif, d.id_personnel, req.params.id]);

    // Sync metrics for old and new employee
    if (oldId) await syncPersonnelMetrics(oldId);
    if (d.id_personnel && d.id_personnel != oldId) await syncPersonnelMetrics(d.id_personnel);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireWrite, async (req, res) => {
  try {
    // Fetch old id_personnel for sync
    const [oldRows] = await db.query('SELECT id_personnel FROM heure_supplementaire WHERE id_heure_sup = ?', [req.params.id]);
    const oldId = oldRows.length ? oldRows[0].id_personnel : null;

    await db.query('DELETE FROM heure_supplementaire WHERE id_heure_sup=?', [req.params.id]);

    // Sync metrics for employee
    if (oldId) await syncPersonnelMetrics(oldId);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
