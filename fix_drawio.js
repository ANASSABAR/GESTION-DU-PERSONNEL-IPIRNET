const fs = require('fs');
let xml = fs.readFileSync('../Untitled Diagram.drawio', 'utf8');

// The cells that were incorrectly added are matching:
// value="motif (liste fixe)"
const regex = /\s*<mxCell[^>]+value="motif \(liste fixe\)"[^>]*>.*?<\/mxCell>/gs;

// Remove them entirely
xml = xml.replace(regex, '');

fs.writeFileSync('../Untitled Diagram.drawio', xml);
console.log('Removed motif (liste fixe)');
