const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// The file currently has 3 broken blocks: renderPersonnel, renderRemunerations, renderEvaluations
// In these blocks, it starts with `const trs = rows.map(r=>\`` 
// and ends with `</tr>\`;\n    }).join('');`

// For renderPersonnel:
html = html.replace(/<\/td>\s*<\/tr>\`;\s*\}\)\.join\(''\);/g, "</td>\n      </tr>`).join('');");

fs.writeFileSync('public/index.html', html);
