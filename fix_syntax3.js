const fs = require('fs');
let html = fs.readFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', 'utf8');

// We have syntax error in several map functions:
// const trs = rows.map(r=>` ... </tr>`; }).join('');
// We need to change `</tr>`; }).join('');` to `</tr>`).join('');`

html = html.replace(/<\/tr>\`;\s*\}\)\.join\(''\);/g, '</tr>`).join(\\'\\');');

fs.writeFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', html);
