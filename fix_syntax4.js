const fs = require('fs');
let html = fs.readFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', 'utf8');

// We need to change `</tr>`; }).join('');` to `</tr>`).join('');`
// But wait, the replace regex is matching ANY `</tr>\`; }).join('');`
// including the ones from renderHeures which SHOULD have `}`.
// So we must be careful.

html = html.replace(/const trs = rows\.map\(([a-z]+)=>\`([\s\S]*?)<\/tr>\`;\s*\}\)\.join\(''\);/g, (match, varName, body) => {
    return 'const trs = rows.map(' + varName + '=>`' + body + '</tr>`).join("");';
});

fs.writeFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', html);
