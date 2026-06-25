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
      SELECT r.*, p.num_cnss, CONCAT(p.nom, ' ', p.prenom) AS nom_complet
      FROM remuneration r JOIN personnel p ON r.id_personnel = p.id_personnel
      ORDER BY r.date_paiement DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.*, 
        p.nom, 
        p.prenom, 
        p.statut,
        p.num_cnss,
        CONCAT(p.nom, ' ', p.prenom) AS nom_complet
      FROM remuneration r
      JOIN personnel p ON r.id_personnel = p.id_personnel
      WHERE r.id_remuneration = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Rémunération introuvable' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireWrite, async (req, res) => {
  try {
    const d = req.body;
    const err = validate([
      isValidDate(d.date_paiement, { label: 'Date de paiement', minYear: 2000, maxYear: 2099 }),
    ]);
    if (err) return res.status(400).json({ error: err });

    const [hsRows] = await db.query('SELECT COALESCE(SUM(nombre_heures), 0) AS total_hs FROM heure_supplementaire WHERE id_personnel = ?', [d.id_personnel]);
    const total_hs = hsRows[0].total_hs;

    const base = parseFloat(d.salaire_base) || 0;
    const prime = parseFloat(d.prime) || 0;
    const px_hs = parseFloat(d.prix_unitaire_heure) || 0;
    const montant_hs = total_hs * px_hs;
    const brut = base + prime + montant_hs;
    const deduction_cnss = brut * 0.0448; // 4.48% CNSS
    const amo = brut * 0.0226; // 2.26% AMO
    const cimr = parseFloat(d.cimr) || 0;
    
    let salaire_imposable = brut - deduction_cnss - amo - cimr;
    if (salaire_imposable < 0) salaire_imposable = 0;
    
    let ir = 0;
    let imp = salaire_imposable;
    if (imp > 10000) { ir += (imp - 10000) * 0.20; imp = 10000; }
    if (imp > 6000) { ir += (imp - 6000) * 0.15; imp = 6000; }
    if (imp > 3000) { ir += (imp - 3000) * 0.10; imp = 3000; }
    const net_a_payer = salaire_imposable - ir;

    await db.query(
      'INSERT INTO remuneration (salaire_base, prime, quantite_heures_supp, prix_unitaire_heure, deduction_cnss, amo, cimr, ir, salaire_imposable, net_a_payer, date_paiement, id_personnel) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [base, prime, total_hs, px_hs, deduction_cnss, amo, cimr, ir, salaire_imposable, net_a_payer, d.date_paiement || null, d.id_personnel]);

    // Sync metrics for this employee
    await syncPersonnelMetrics(d.id_personnel);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireWrite, async (req, res) => {
  try {
    const d = req.body;
    const err = validate([
      isValidDate(d.date_paiement, { label: 'Date de paiement', minYear: 2000, maxYear: 2099 }),
    ]);
    if (err) return res.status(400).json({ error: err });

    // Fetch old id_personnel for sync
    const [oldRows] = await db.query('SELECT id_personnel FROM remuneration WHERE id_remuneration = ?', [req.params.id]);
    const oldId = oldRows.length ? oldRows[0].id_personnel : null;

    const [hsRows] = await db.query('SELECT COALESCE(SUM(nombre_heures), 0) AS total_hs FROM heure_supplementaire WHERE id_personnel = ?', [d.id_personnel]);
    const total_hs = hsRows[0].total_hs;

    const base = parseFloat(d.salaire_base) || 0;
    const prime = parseFloat(d.prime) || 0;
    const px_hs = parseFloat(d.prix_unitaire_heure) || 0;
    const montant_hs = total_hs * px_hs;
    const brut = base + prime + montant_hs;
    const deduction_cnss = brut * 0.0448; // 4.48% CNSS
    const amo = brut * 0.0226; // 2.26% AMO
    const cimr = parseFloat(d.cimr) || 0;
    
    let salaire_imposable = brut - deduction_cnss - amo - cimr;
    if (salaire_imposable < 0) salaire_imposable = 0;
    
    let ir = 0;
    let imp = salaire_imposable;
    if (imp > 10000) { ir += (imp - 10000) * 0.20; imp = 10000; }
    if (imp > 6000) { ir += (imp - 6000) * 0.15; imp = 6000; }
    if (imp > 3000) { ir += (imp - 3000) * 0.10; imp = 3000; }
    const net_a_payer = salaire_imposable - ir;

    await db.query(
      'UPDATE remuneration SET salaire_base=?, prime=?, quantite_heures_supp=?, prix_unitaire_heure=?, deduction_cnss=?, amo=?, cimr=?, ir=?, salaire_imposable=?, net_a_payer=?, date_paiement=?, id_personnel=? WHERE id_remuneration=?',
      [base, prime, total_hs, px_hs, deduction_cnss, amo, cimr, ir, salaire_imposable, net_a_payer, d.date_paiement || null, d.id_personnel, req.params.id]);

    // Sync metrics for old and new employee
    if (oldId) await syncPersonnelMetrics(oldId);
    if (d.id_personnel && d.id_personnel != oldId) await syncPersonnelMetrics(d.id_personnel);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireWrite, async (req, res) => {
  try {
    // Fetch old id_personnel for sync
    const [oldRows] = await db.query('SELECT id_personnel FROM remuneration WHERE id_remuneration = ?', [req.params.id]);
    const oldId = oldRows.length ? oldRows[0].id_personnel : null;

    await db.query('DELETE FROM remuneration WHERE id_remuneration=?', [req.params.id]);

    // Sync metrics for employee
    if (oldId) await syncPersonnelMetrics(oldId);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
