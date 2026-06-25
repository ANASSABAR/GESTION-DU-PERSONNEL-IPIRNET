const router = require('express').Router();
const db = require('../db');
const { isValidDate, validate } = require('./dateValidator');

router.get('/', async (req, res) => {
  try {
    const q = req.query.q || '';
    const [raw] = await db.query(`
      SELECT a.*, CONCAT(p.nom, ' ', p.prenom) AS nom_complet
      FROM absence a JOIN personnel p ON a.id_personnel = p.id_personnel
      WHERE CONCAT(p.nom, ' ', p.prenom) LIKE ?
      ORDER BY a.date_debut DESC`, [`%${q}%`]);
    res.json(raw);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.*, 
        p.nom, 
        p.prenom, 
        p.statut,
        CONCAT(p.nom, ' ', p.prenom) AS nom_complet
      FROM absence a 
      JOIN personnel p ON a.id_personnel = p.id_personnel
      WHERE a.id_absence = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Absence introuvable' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const err = validate([
      isValidDate(d.date_debut, { label: 'Date de début', minYear: 2000, maxYear: 2099 }),
      isValidDate(d.date_fin,   { label: 'Date de fin',   minYear: 2000, maxYear: 2099 }),
      require('./dateValidator').isOrderValid(d.date_debut, d.date_fin, 'Date de début', 'Date de fin'),
    ]);
    if (err) return res.status(400).json({ error: err });

    await db.query(
      'INSERT INTO absence (date_debut, date_fin, type_absence, nombre_jours, statut, motif, id_personnel) VALUES (?,?,?,?,?,?,?)',
      [d.date_debut, d.date_fin, d.type_absence, d.nombre_jours || 0, d.statut, d.motif || null, d.id_personnel]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    const err = validate([
      isValidDate(d.date_debut, { label: 'Date de début', minYear: 2000, maxYear: 2099 }),
      isValidDate(d.date_fin,   { label: 'Date de fin',   minYear: 2000, maxYear: 2099 }),
      require('./dateValidator').isOrderValid(d.date_debut, d.date_fin, 'Date de début', 'Date de fin'),
    ]);
    if (err) return res.status(400).json({ error: err });

    await db.query(
      'UPDATE absence SET date_debut=?, date_fin=?, type_absence=?, nombre_jours=?, statut=?, motif=?, id_personnel=? WHERE id_absence=?',
      [d.date_debut, d.date_fin, d.type_absence, d.nombre_jours || 0, d.statut, d.motif || null, d.id_personnel, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM absence WHERE id_absence=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
