const fs = require('fs');

function updateIndex() {
  let content = fs.readFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', 'utf8');

  // Update renderAbsences
  content = content.replace(
    /const trs = rows\.map\(a=>`\s*<tr>\s*<td>\$\{a\.nom_complet\}<\/td>\s*<td><span class="badge b-purple">\$\{a\.type_absence\|\|'-'\}<\/span><\/td>/g,
    `const trs = rows.map(a=>{
      const ta = a.type_absence || '-';
      const taClass = ta === 'Personnel' ? 'b-primary' : ta === 'Formation' ? 'b-info' : ta === 'Maladie' ? 'b-danger' : ta === 'Congé' ? 'b-success' : ta === 'Exceptionnelle' ? 'b-warning' : 'b-secondary';
      return \`
      <tr>
        <td>\${a.nom_complet}</td>
        <td><span class="badge \${taClass}">\${ta}</span></td>`
  );
  
  // Close the backtick template for trs
  content = content.replace(
    /        <\/td>\s*<\/tr>`\)\.join\(''\);/g,
    `        </td>
      </tr>\`;
    }).join('');`
  );

  // Update openAbsenceModal options
  content = content.replace(
    /\{ id:'f-type',[\s\S]*?\{value:'Autre',label:'Autre'\}\] \},/g,
    `{ id:'f-type',   label:'Type', type:'select', value:d.type_absence||'Personnel',
      options:[{value:'Personnel',label:'Personnel'},{value:'Formation',label:'Formation'},
               {value:'Maladie',label:'Maladie'},{value:'Congé',label:'Congé'},{value:'Exceptionnelle',label:'Exceptionnelle'}] },`
  );

  // Remove motif field from options
  content = content.replace(
    /,\s*\{ id:'f-motif', label:'Motif', type:'text', value:d\.motif\|\|'', fullWidth:true \}/g,
    ''
  );

  // Update body payload
  content = content.replace(
    /date_debut:dd, date_fin:df, nombre_jours:val\('f-jours'\)\|\|0, motif:val\('f-motif'\) \};/g,
    `date_debut:dd, date_fin:df, nombre_jours:val('f-jours')||0 };`
  );

  fs.writeFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', content);
  console.log("Updated index.html");
}

function updatePrintAbsences() {
  let content = fs.readFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/print-absences.html', 'utf8');

  // Remove Motif column header
  content = content.replace(/<th>Motif<\/th>/g, '');
  
  // Remove motif column data
  content = content.replace(/<td>\$\{a\.motif \|\| '-'\}<\/td>/g, '');

  fs.writeFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/print-absences.html', content);
  console.log("Updated print-absences.html");
}

function updateFicheAbsence() {
  let content = fs.readFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/fiches/fiche-absence.html', 'utf8');

  // Find Motif header and value
  content = content.replace(/\s*<th>Motif<\/th>\s*<td id="val-motif">-<\/td>/g, '');

  // Find the textContent assignment
  content = content.replace(/document\.getElementById\('val-motif'\)\.textContent = a\.motif \|\| '-';/g, '');

  fs.writeFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/fiches/fiche-absence.html', content);
  console.log("Updated fiche-absence.html");
}

try {
  updateIndex();
  updatePrintAbsences();
  updateFicheAbsence();
} catch (e) {
  console.error(e);
}
