const fs = require('fs');
const xml = fs.readFileSync('../Untitled Diagram.drawio', 'utf8');
const matches = [...xml.matchAll(/<mxCell[^>]*value="([^"]+)"[^>]*>/g)];
let out = '';
matches.forEach(m => {
  const v = m[1];
  const decoded = v.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  if (decoded.includes('PERSONNEL') || decoded.includes('HEURE') || decoded.includes('REMUNERATION')) {
    out += '====\n' + decoded + '\n';
  }
});
fs.writeFileSync('temp_xml.txt', out);
