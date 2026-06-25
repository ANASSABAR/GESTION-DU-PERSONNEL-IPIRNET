const db = require('./db');
async function test() {
  try {
    console.log('Testing dashboard queries...');
    await db.query(`SELECT COUNT(*) AS total_personnel FROM PERSONNEL WHERE statut = 'Actif'`);
    await db.query(`SELECT COUNT(*) AS total_absences, SUM(CASE WHEN statut = 'Non justifiée' THEN 1 ELSE 0 END) AS non_justifiees FROM ABSENCE WHERE MONTH(date_debut) = MONTH(CURRENT_DATE())`);
    await db.query(`SELECT SUM(nombre_heures) AS total_heures FROM HEURE_SUPPLEMENTAIRE WHERE MONTH(date) = MONTH(CURRENT_DATE())`);
    await db.query(`SELECT SUM(salaire_net) AS masse_salariale FROM REMUNERATION`);
    await db.query(`SELECT COUNT(*) AS evals_attente FROM PERSONNEL p WHERE p.id_personnel NOT IN (SELECT id_personnel FROM EVALUATION_PERSONNEL)`);
    await db.query(`SELECT c.libelle_categorie, COUNT(p.id_personnel) as total FROM CATEGORIE c LEFT JOIN PERSONNEL p ON c.id_categorie = p.id_categorie GROUP BY c.id_categorie`);
    await db.query(`SELECT p.nom, p.prenom, p.email, p.date_recrutement, p.statut, c.libelle_categorie FROM PERSONNEL p JOIN CATEGORIE c ON p.id_categorie = c.id_categorie ORDER BY p.date_recrutement DESC LIMIT 5`);
    console.log('All dashboard queries successful.');
  } catch (e) {
    console.error('Error in dashboard queries:', e.message);
  } finally {
    process.exit(0);
  }
}
test();
