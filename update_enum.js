const db = require('./db');
async function updateEnum() {
  try {
    await db.query(`ALTER TABLE document_personnel MODIFY COLUMN type_document ENUM(
      'Fiche Personnel',
      'Fiche Absence',
      'Fiche Heures Supplémentaires',
      'Bulletin de Paie',
      'Rapport Personnel Global',
      'Rapport Absences Global',
      'Rapport Heures Supplémentaires Global',
      'Rapport Rémunérations Global',
      'Document Administratif',
      'Évaluation Personnel',
      'Historique Document',
      'Livret Individuel',
      'Planning Prévisionnel',
      'Emploi du Temps',
      'Module de Formation',
      'Données de Diplômes'
    ) NOT NULL`);
    console.log('Enum updated successfully');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
updateEnum();
