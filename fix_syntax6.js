const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// The bad string was introduced by my regex replace.
// The string in the file is EXACTLY:
// </tr>`;
//     }).join('');

const badEnd = "</tr>`;\n    }).join('');";
const goodEnd = "</tr>`).join('');";

const occurrences = html.split(badEnd).length - 1;
console.log('Occurrences found:', occurrences);

if (occurrences > 0) {
  html = html.split(badEnd).join(goodEnd);
  
  // Wait, renderHeures should be:
  // </tr>`;
  //     }).join('');
  // because renderHeures starts with rows.map(h=>{
  
  // Let me replace all of them with goodEnd, and then ONLY fix renderHeures which is the only one that uses {}
  
  // renderHeures starts with: const trs = rows.map(h=>{
  // and ends with: </tr>`).join('');
  // So we will fix renderHeures explicitly
  html = html.replace(/const trs = rows\.map\(h=>\{\s*const contrat = h\.contrat\|\|'-';([\s\S]*?)<\/tr>\`\)\.join\(''\);/g, (match, p1) => {
    return "const trs = rows.map(h=>{\n      const contrat = h.contrat||'-';" + p1 + "</tr>`;\n    }).join('');";
  });
  
  // Also renderAbsences uses {}
  // renderAbsences starts with: const trs = rows.map(a=>{
  // So we must fix it too
  html = html.replace(/const trs = rows\.map\(a=>\{\s*const ta = a\.type_absence \|\| '—';([\s\S]*?)<\/tr>\`\)\.join\(''\);/g, (match, p1) => {
    return "const trs = rows.map(a=>{\n      const ta = a.type_absence || '—';" + p1 + "</tr>`;\n    }).join('');";
  });

  // Also renderDocuments uses {}
  // renderDocuments starts with: const trs = rows.map(doc=>{
  html = html.replace(/const trs = rows\.map\(doc=>\{\s*const isPdf = doc\.chemin_fichier/g, (match) => {
    return match; // just testing if it exists
  });
  html = html.replace(/const trs = rows\.map\(doc=>\{([\s\S]*?)<\/tr>\`\)\.join\(''\);/g, (match, p1) => {
    return "const trs = rows.map(doc=>{" + p1 + "</tr>`;\n    }).join('');";
  });
  
  fs.writeFileSync('public/index.html', html);
  console.log('Fixed syntax!');
}
