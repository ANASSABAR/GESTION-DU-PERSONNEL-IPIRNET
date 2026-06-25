const db = require('./db');
async function test() {
  const [docs] = await db.query(`
    SELECT d.id_document, d.id_personnel, d.type_document,
           (d.contenu_html IS NOT NULL AND d.contenu_html != '') AS has_saved_html,
           CONCAT(p.nom, ' ', p.prenom) AS nom_complet
    FROM document_personnel d
    LEFT JOIN personnel p ON d.id_personnel = p.id_personnel
    ORDER BY d.id_document
  `);
  
  console.log('\n=== Documents en base ===');
  console.log('ID  | type_document                         | Personnel          | has_saved_html');
  console.log('----+---------------------------------------+--------------------+---------------');
  docs.forEach(d => {
    const id    = String(d.id_document).padEnd(4);
    const type  = (d.type_document || '').padEnd(38);
    const nom   = (d.nom_complet  || 'N/A').padEnd(20);
    console.log(id, '|', type, '|', nom, '|', d.has_saved_html ? 'OUI' : 'non');
  });

  // Also show the mapping that getDocUrl() uses
  const MAP = {
    'Livret Individuel':     'livret.html',
    'Planning Prévisionnel': 'planning.html',
    'Emploi du Temps':       'emploi.html',
    'Module de Formation':   'module.html',
    'Données de Diplômes':   'diplome.html',
  };

  console.log('\n=== Résultat du mapping pour chaque doc WYSIWYG ===');
  docs.forEach(d => {
    const template = MAP[d.type_document];
    if (template) {
      console.log('Doc #' + d.id_document, '(', d.nom_complet, ') ->', d.type_document, '=>', template, '?id=' + d.id_document);
    }
  });

  process.exit(0);
}
test().catch(e => { console.error(e.message); process.exit(1); });
