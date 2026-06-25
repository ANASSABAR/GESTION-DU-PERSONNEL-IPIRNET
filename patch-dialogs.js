const fs = require('fs');
const path = require('path');

const files = [
  'fiche-evaluation.html', 
  'fiche-heure.html', 
  'fiche-personnel.html', 
  'fiche-remuneration.html'
].map(f => path.join('public', 'fiches', f));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('dialogs.css')) {
      content = content.replace(/<\/title>/, '</title>\n  <link rel="stylesheet" href="/dialogs.css">');
      content = content.replace(/<\/body>/, '<script src="/dialogs.js"></script>\n</body>');
  }
  content = content.replace(/alert\(/g, "ipirnetAlert(");
  fs.writeFileSync(f, content);
});
console.log('Patched all fiches');
