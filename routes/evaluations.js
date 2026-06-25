const router = require('express').Router();
const db = require('../db');
const { isValidDate, validate } = require('./dateValidator');

router.get('/', async (req, res) => {
  try {
    const role = req.user.role;
    let query = `
      SELECT e.*, CONCAT(p.nom, ' ', p.prenom) AS nom_complet
      FROM evaluation_personnel e
      JOIN personnel p ON e.id_personnel = p.id_personnel
      WHERE 1=1
    `;
    let params = [];

    if (role === 'Formateur') {
      query += ` AND e.id_personnel = ?`;
      params.push(req.user.id_personnel);
    }

    if (req.query.id_personnel) {
      query += ` AND e.id_personnel = ?`;
      params.push(req.query.id_personnel);
    }

    query += ` ORDER BY e.date_evaluation DESC`;

    if (req.query.limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(req.query.limit, 10) || 1);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    
    if (req.user.role === 'Formateur' && parseInt(d.id_personnel) !== req.user.id_personnel) {
      return res.status(403).json({ error: 'Vous ne pouvez ajouter une évaluation que pour vous-même.' });
    }

    const err = validate([
      isValidDate(d.date_evaluation, { label: "Date d'évaluation", minYear: 2000, maxYear: 2099, notFuture: true }),
    ]);
    if (err) return res.status(400).json({ error: err });

    if (d.note !== null && d.note !== '' && (parseFloat(d.note) < 0 || parseFloat(d.note) > 20))
      return res.status(400).json({ error: 'La note doit être comprise entre 0 et 20.' });

    await db.query(
      'INSERT INTO evaluation_personnel (date_evaluation, note, commentaire, id_personnel) VALUES (?,?,?,?)',
      [d.date_evaluation, d.note || null, d.commentaire, d.id_personnel]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    
    if (req.user.role === 'Formateur') {
      const [evalRows] = await db.query('SELECT id_personnel FROM evaluation_personnel WHERE id_evaluation = ?', [req.params.id]);
      if (evalRows.length === 0 || evalRows[0].id_personnel !== req.user.id_personnel) {
        return res.status(403).json({ error: 'Accès interdit ou évaluation introuvable.' });
      }
      if (parseInt(d.id_personnel) !== req.user.id_personnel) {
        return res.status(403).json({ error: 'Vous ne pouvez pas réassigner cette évaluation.' });
      }
    }

    const err = validate([
      isValidDate(d.date_evaluation, { label: "Date d'évaluation", minYear: 2000, maxYear: 2099, notFuture: true }),
    ]);
    if (err) return res.status(400).json({ error: err });

    if (d.note !== null && d.note !== '' && (parseFloat(d.note) < 0 || parseFloat(d.note) > 20))
      return res.status(400).json({ error: 'La note doit être comprise entre 0 et 20.' });

    await db.query(
      'UPDATE evaluation_personnel SET date_evaluation=?, note=?, commentaire=?, id_personnel=? WHERE id_evaluation=?',
      [d.date_evaluation, d.note || null, d.commentaire, d.id_personnel, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role === 'Formateur') {
      const [evalRows] = await db.query('SELECT id_personnel FROM evaluation_personnel WHERE id_evaluation = ?', [req.params.id]);
      if (evalRows.length === 0 || evalRows[0].id_personnel !== req.user.id_personnel) {
        return res.status(403).json({ error: 'Accès interdit ou évaluation introuvable.' });
      }
    }
    
    await db.query('DELETE FROM evaluation_personnel WHERE id_evaluation=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
