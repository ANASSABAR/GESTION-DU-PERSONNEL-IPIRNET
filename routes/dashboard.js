const router = require('express').Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [[{ total_personnel }]] = await db.query("SELECT COUNT(*) AS total_personnel FROM PERSONNEL WHERE statut = 'Actif'");
    const [[{ total_absences, non_justifiees }]] = await db.query(`
      SELECT 
        COUNT(*) AS total_absences,
        SUM(CASE WHEN statut = 'Non justifiée' THEN 1 ELSE 0 END) AS non_justifiees
      FROM ABSENCE
      WHERE MONTH(date_debut) = MONTH(CURRENT_DATE())
    `);
    
    const [[{ total_heures }]] = await db.query(`
      SELECT SUM(nombre_heures) AS total_heures 
      FROM HEURE_SUPPLEMENTAIRE 
      WHERE MONTH(date) = MONTH(CURRENT_DATE())
    `);

    const [[{ masse_salariale }]] = await db.query(`
      SELECT SUM(salaire_net) AS masse_salariale FROM REMUNERATION
    `);

    const [[{ evals_attente }]] = await db.query(`
      SELECT COUNT(*) AS evals_attente FROM PERSONNEL p 
      WHERE p.id_personnel NOT IN (SELECT id_personnel FROM EVALUATION_PERSONNEL)
    `);

    const [par_categorie] = await db.query(`
      SELECT c.libelle_categorie, COUNT(p.id_personnel) as total
      FROM CATEGORIE c LEFT JOIN PERSONNEL p ON c.id_categorie = p.id_categorie
      GROUP BY c.id_categorie
    `);

    const [recent] = await db.query(`
      SELECT p.nom, p.prenom, p.email, p.date_recrutement, p.statut, c.libelle_categorie
      FROM PERSONNEL p JOIN CATEGORIE c ON p.id_categorie = c.id_categorie
      ORDER BY p.date_recrutement DESC LIMIT 5
    `);

    res.json({
      total_personnel: total_personnel || 0,
      total_absences: total_absences || 0,
      non_justifiees: non_justifiees || 0,
      total_heures: total_heures || 0,
      masse_salariale: masse_salariale || 0,
      evals_attente: evals_attente || 0,
      par_categorie,
      recent
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
