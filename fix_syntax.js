const fs = require('fs');
let content = fs.readFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', 'utf8');

// The file currently has:
// const trs = rows.map(a=>`
// ...
// </tr>`;
// }).join('');

// I will replace `const trs = rows.map(a=>\`` with `const trs = rows.map(a=>{` + new logic

content = content.replace(
  /const trs = rows\.map\(a=>`[\s\S]*?<td><span class="badge b-purple">\$\{a\.type_absence\|\|'—'\}<\/span><\/td>/g,
  `const trs = rows.map(a=>{
      const ta = a.type_absence || '—';
      const taClass = ta === 'Personnel' ? 'b-primary' : ta === 'Formation' ? 'b-info' : ta === 'Maladie' ? 'b-danger' : ta === 'Congé' ? 'b-success' : ta === 'Exceptionnelle' ? 'b-warning' : 'b-secondary';
      return \`
      <tr>
        <td>\${a.nom_complet}</td>
        <td><span class="badge \${taClass}">\${ta}</span></td>`
);

fs.writeFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', content);
console.log("Fixed renderAbsences syntax error!");
