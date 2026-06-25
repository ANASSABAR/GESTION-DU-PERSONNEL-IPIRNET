const db = require('./db');

(async () => {
  try {
    const [[{ total_personnel }]] = await db.query("SELECT COUNT(*) AS total_personnel FROM PERSONNEL WHERE statut = 'Actif'");
    console.log('1', total_personnel);
    
    const [[{ total_absences, non_justifiees }]] = await db.query('SELECT COUNT(*) AS total_absences, SUM(CASE WHEN statut = \'Non justifiée\' THEN 1 ELSE 0 END) AS non_justifiees FROM ABSENCE WHERE MONTH(date_debut) = MONTH(CURRENT_DATE())');
    console.log('2', total_absences);
    
    const [[{ total_heures }]] = await db.query('SELECT SUM(nombre_heures) AS total_heures FROM HEURE_SUPPLEMENTAIRE WHERE MONTH(date) = MONTH(CURRENT_DATE())');
    console.log('3', total_heures);
    
    const [[{ masse_salariale }]] = await db.query('SELECT SUM(salaire_net) AS masse_salariale FROM REMUNERATION');
    console.log('4', masse_salariale);
    
    const [[{ evals_attente }]] = await db.query('SELECT COUNT(*) AS evals_attente FROM PERSONNEL p WHERE p.id_personnel NOT IN (SELECT id_personnel FROM EVALUATION_PERSONNEL)');
    console.log('5', evals_attente);
    
    const [par_categorie] = await db.query('SELECT c.libelle_categorie, COUNT(p.id_personnel) as total FROM CATEGORIE c LEFT JOIN PERSONNEL p ON c.id_categorie = p.id_categorie GROUP BY c.id_categorie');
    console.log('6', par_categorie);
    
    const [recent] = await db.query('SELECT p.nom, p.prenom, p.email, p.date_recrutement, p.statut, c.libelle_categorie FROM PERSONNEL p JOIN CATEGORIE c ON p.id_categorie = c.id_categorie ORDER BY p.date_recrutement DESC LIMIT 5');
    console.log('7', recent);
    
    console.log('SUCCESS!');
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit();
})();
