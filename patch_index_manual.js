const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const dynamicLogicReplacement = `
  const manualTypes = ['Livret Individuel', 'Planning Prévisionnel', 'Emploi du Temps', 'Module de Formation', 'Données de Diplômes'];
  
  // Create container for manual fields
  const formGrid = document.querySelector('#modal-content .form-grid');
  const manualContainer = document.createElement('div');
  manualContainer.id = 'manual-fields-container';
  manualContainer.style.gridColumn = '1 / -1';
  manualContainer.style.display = 'none';
  manualContainer.style.gap = '15px';
  manualContainer.style.flexDirection = 'column';
  formGrid.appendChild(manualContainer);

  const typeSelect = document.getElementById('f-type');
  const persSelectContainer = document.getElementById('f-pid').parentElement;
  const absSelectContainer = document.getElementById('f-absence').parentElement;
  const hsSelectContainer = document.getElementById('f-heure').parentElement;
  const remSelectContainer = document.getElementById('f-remun').parentElement;

  let savedJson = {};
  if (d.contenu_json) {
    try { savedJson = JSON.parse(d.contenu_json); } catch(e){}
  }

  function updateFields() {
    const v = typeSelect.value;
    
    // Default hiding for auto fields
    absSelectContainer.style.display = 'none';
    hsSelectContainer.style.display = 'none';
    remSelectContainer.style.display = 'none';
    manualContainer.style.display = 'none';
    manualContainer.innerHTML = '';

    if (v === 'Fiche Absence') absSelectContainer.style.display = 'block';
    else if (v === 'Fiche Heures Supplémentaires') hsSelectContainer.style.display = 'block';
    else if (v === 'Bulletin de Paie') remSelectContainer.style.display = 'block';
    else if (manualTypes.includes(v)) {
      manualContainer.style.display = 'flex';
      
      let html = '';
      if (v === 'Livret Individuel') {
        html = \`
          <label>Filière <input type="text" id="m-filiere" value="\${savedJson.filiere||''}"></label>
          <label>Niveau <input type="text" id="m-niveau" value="\${savedJson.niveau||''}"></label>
          <label>Année Formation <input type="text" id="m-annee" value="\${savedJson.annee||''}"></label>
          <label>Modules Étudiés (Texte libre / Observations) <textarea id="m-modules">\${savedJson.modules||''}</textarea></label>
        \`;
      } else if (v === 'Planning Prévisionnel') {
        html = \`
          <label>Année de Formation <input type="text" id="m-annee" value="\${savedJson.annee||''}"></label>
          <label>Tableau Planning (Format texte CSV/Lignes libres) <textarea id="m-planning" placeholder="Ex: Date | Tâche | Responsable | Remarque">\${savedJson.planning||''}</textarea></label>
        \`;
      } else if (v === 'Emploi du Temps') {
        html = \`
          <label>Semaine du <input type="text" id="m-semaine" value="\${savedJson.semaine||''}"></label>
          <label>Emploi (Format texte CSV/Lignes libres) <textarea id="m-emploi" placeholder="Ex: Jour | Heure Début | Heure Fin | Module | Salle">\${savedJson.emploi||''}</textarea></label>
        \`;
      } else if (v === 'Module de Formation') {
        html = \`
          <label>Filière <input type="text" id="m-filiere" value="\${savedJson.filiere||''}"></label>
          <label>Niveau <input type="text" id="m-niveau" value="\${savedJson.niveau||''}"></label>
          <label>Année Formation <input type="text" id="m-annee" value="\${savedJson.annee||''}"></label>
          <label>Code Module <input type="text" id="m-code" value="\${savedJson.code||''}"></label>
          <label>Intitulé <input type="text" id="m-intitule" value="\${savedJson.intitule||''}"></label>
          <label>Masse Horaire <input type="text" id="m-heures" value="\${savedJson.heures||''}"></label>
          <label>Formateur <input type="text" id="m-formateur" value="\${savedJson.formateur||''}"></label>
          <label>Objectif <textarea id="m-objectif">\${savedJson.objectif||''}</textarea></label>
          <label>Évaluation <input type="text" id="m-evaluation" value="\${savedJson.evaluation||''}"></label>
        \`;
      } else if (v === 'Données de Diplômes') {
        html = \`
          <label>Filière <input type="text" id="m-filiere" value="\${savedJson.filiere||''}"></label>
          <label>Niveau <input type="text" id="m-niveau" value="\${savedJson.niveau||''}"></label>
          <label>Année Formation <input type="text" id="m-annee" value="\${savedJson.annee||''}"></label>
          <label>N° Diplôme <input type="text" id="m-num" value="\${savedJson.num||''}"></label>
          <label>Mention <input type="text" id="m-mention" value="\${savedJson.mention||''}"></label>
          <label>Date Obtention <input type="text" id="m-dateobt" value="\${savedJson.dateobt||''}"></label>
        \`;
      }
      manualContainer.innerHTML = html;
    }
  }

  typeSelect.addEventListener('change', updateFields);
  updateFields();
`;

// Replace from '// Logique dynamique...' to 'typeSelect.addEventListener('change', updateFields); updateFields();'
html = html.replace(
  /\/\/ Logique dynamique pour afficher\/masquer[\s\S]*?updateFields\(\);/,
  dynamicLogicReplacement
);

// We also need to update the submission logic.
// Find the submission part
const submitLogicOld = \`    const body = { 
        id_personnel: id_pers || null, 
        type_document: type, 
        date_depot: dd, 
        id_absence: type === 'Fiche Absence' ? id_abs : null,
        id_heure_sup: type === 'Fiche Heures Supplémentaires' ? id_hs : null,
        id_remuneration: type === 'Bulletin de Paie' ? id_rem : null
    };
    try {
      if (editingId) { await api(\\\`/documents/\\$\{editingId\}\\\`,'PUT',body); toast('Document modifié'); }
      else { await api('/documents','POST',body); toast('Document ajouté'); }\`;

const submitLogicNew = \`    const body = { 
        id_personnel: id_pers || null, 
        type_document: type, 
        date_depot: dd, 
        id_absence: type === 'Fiche Absence' ? id_abs : null,
        id_heure_sup: type === 'Fiche Heures Supplémentaires' ? id_hs : null,
        id_remuneration: type === 'Bulletin de Paie' ? id_rem : null
    };
    
    // Capture manual fields if any
    const manualTypes = ['Livret Individuel', 'Planning Prévisionnel', 'Emploi du Temps', 'Module de Formation', 'Données de Diplômes'];
    if (manualTypes.includes(type)) {
      body.contenu_json = {};
      const inputs = document.querySelectorAll('#manual-fields-container input, #manual-fields-container textarea');
      inputs.forEach(inp => {
        body.contenu_json[inp.id.replace('m-', '')] = inp.value;
      });
    }

    try {
      if (manualTypes.includes(type)) {
        if (editingId) body.id_document = editingId;
        await api('/documents/generate-manual', 'POST', body);
        toast(editingId ? 'Document manuel modifié' : 'Document manuel ajouté');
      } else {
        if (editingId) { await api(\\\`/documents/\\$\{editingId\}\\\`,'PUT',body); toast('Document modifié'); }
        else { await api('/documents','POST',body); toast('Document ajouté'); }
      }\`;

html = html.replace(submitLogicOld, submitLogicNew);

fs.writeFileSync('public/index.html', html);
console.log('Patched index.html');
