const fs = require('fs');
const path = './public/fiches';
fs.readdirSync(path)
  .filter(f => !f.startsWith('fiche-') && f.endsWith('.html'))
  .forEach(f => {
    let html = fs.readFileSync(`${path}/${f}`, 'utf8');
    html = html.replace(/<button[^>]*>/, '<button class="print-btn no-print" onclick="window.print()">');
    fs.writeFileSync(`${path}/${f}`, html);
    console.log(`Updated ${f}`);
  });
