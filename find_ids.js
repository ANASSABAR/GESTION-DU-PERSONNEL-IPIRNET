const fs = require('fs');
const xml = fs.readFileSync('../Untitled Diagram.drawio', 'utf8');

// Find all mxCell tags
const matches = [...xml.matchAll(/<mxCell\s+id="([^"]+)"[^>]*value="([^"]+)"/g)];
matches.forEach(m => {
  const id = m[1];
  const val = m[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  if (val.includes('PERSONNEL') || val.includes('HEURE') || val.includes('REMUNERATION')) {
    console.log(`Table: ${val} (ID: ${id})`);
  }
});
