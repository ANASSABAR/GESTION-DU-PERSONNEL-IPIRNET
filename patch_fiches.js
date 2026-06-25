const fs = require('fs');

function injectScript(file, replacements, tableLogic) {
  let html = fs.readFileSync('public/fiches/' + file, 'utf8');
  if (html.includes('id="dynamic-script"')) return; // Already patched
  
  const script = `
<script id="dynamic-script">
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get('id');
  if (docId) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    fetch('/api/documents/' + docId, { headers: { 'Authorization': 'Bearer ' + token } })
    .then(r=>r.json())
    .then(doc => {
       const j = JSON.parse(doc.contenu_json || '{}');
       // Direct replacements for basic fields
       let bodyHtml = document.body.innerHTML;
       ${replacements}
       document.body.innerHTML = bodyHtml;
       
       // Table logic
       ${tableLogic}
    })
    .catch(console.error);
  }
</script>
</body>`;
  html = html.replace('</body>', script);
  fs.writeFileSync('public/fiches/' + file, html);
  console.log('Patched', file);
}

// 1. Livret
injectScript('livret.html', `
  bodyHtml = bodyHtml.replace('Safir Khalid', doc.nom_complet || '');
  bodyHtml = bodyHtml.replace('Technicien Spécialisé en Développement Informatique', j.filiere || '');
  bodyHtml = bodyHtml.replace('2ème Année', j.niveau || '');
  bodyHtml = bodyHtml.replace('2024 / 2025', j.annee || '');
`, `
  const tables = document.querySelectorAll('table');
  if (tables.length > 1 && j.modules) {
    tables[1].innerHTML = '<tr><th>Observations / Modules</th></tr><tr><td style="white-space: pre-wrap; text-align: left; padding: 20px;">' + j.modules + '</td></tr>';
  }
`);

// 2. Planning
injectScript('planning.html', `
  bodyHtml = bodyHtml.replace('2023-2024', j.annee || '');
`, `
  const tables = document.querySelectorAll('table');
  if (tables.length > 0 && j.planning) {
    tables[0].innerHTML = '<tr><th>Planning / Tâches</th></tr><tr><td style="white-space: pre-wrap; text-align: left; padding: 20px;">' + j.planning + '</td></tr>';
  }
`);

// 3. Emploi
injectScript('emploi.html', `
  // The original has 'Semaine du XX au XX', we can try to replace the h1 or h2 that has 'Semaine'
  bodyHtml = bodyHtml.replace(/Semaine du.*?2024/, 'Semaine du ' + (j.semaine || ''));
`, `
  const tables = document.querySelectorAll('table');
  if (tables.length > 0 && j.emploi) {
    tables[0].innerHTML = '<tr><th>Emploi du Temps</th></tr><tr><td style="white-space: pre-wrap; text-align: left; padding: 20px;">' + j.emploi + '</td></tr>';
  }
`);

// 4. Module
injectScript('module.html', `
  // We don't have hardcoded person name in module, just fields
  bodyHtml = bodyHtml.replace('Technicien Spécialisé en Développement Informatique', j.filiere || '');
  bodyHtml = bodyHtml.replace('2ème Année', j.niveau || '');
  bodyHtml = bodyHtml.replace('2024 / 2025', j.annee || '');
  bodyHtml = bodyHtml.replace('MF202', j.code || '');
  bodyHtml = bodyHtml.replace('Base de Données', j.intitule || '');
  bodyHtml = bodyHtml.replace('90H', j.heures || '');
  bodyHtml = bodyHtml.replace('Mr. ABDOUSSI', j.formateur || '');
  bodyHtml = bodyHtml.replace('Comprendre les SGBD Relationnels', j.objectif || '');
  bodyHtml = bodyHtml.replace('Contrôle + Examen Final', j.evaluation || '');
`, '');

// 5. Diplome
injectScript('diplome.html', `
  bodyHtml = bodyHtml.replace('Safir Khalid', doc.nom_complet || '');
  bodyHtml = bodyHtml.replace('WA321315', doc.cin || '');
  bodyHtml = bodyHtml.replace('Technicien Spécialisé en Développement Informatique', j.filiere || '');
  bodyHtml = bodyHtml.replace('2ème Année', j.niveau || '');
  bodyHtml = bodyHtml.replace('2024 / 2025', j.annee || '');
  bodyHtml = bodyHtml.replace('DIP-2025-001', j.num || '');
  bodyHtml = bodyHtml.replace('Bien', j.mention || '');
  bodyHtml = bodyHtml.replace('25 Juillet 2025', j.dateobt || '');
`, '');

console.log('Done');
