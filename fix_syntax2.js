const fs = require('fs');
let html = fs.readFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', 'utf8');

let count = 0;
html = html.replace(/const trs = rows\.map\(([a-z]+)=>\`([\s\S]*?)<\/tr>\`;\s*\}\)\.join\(''\);/g, (match, varName, body) => {
    count++;
    return 'const trs = rows.map(' + varName + '=>`' + body + '</tr>`).join(\\'\\');';
});

console.log('Fixed:', count);
fs.writeFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', html);
