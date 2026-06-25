const fs = require('fs');
let xml = fs.readFileSync('../Untitled Diagram.drawio', 'utf8');

// List of exact values to delete
const toDelete = [
    'deduction',
    '-- Formule --',
    'Net = Base + Prime',
    '+ HS - CNSS'
];

toDelete.forEach(val => {
    // Need to safely escape any regex characters in val. The + is an issue in regex.
    const escapedVal = val.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`\\s*<mxCell[^>]+value="${escapedVal}"[^>]*>.*?<\\/mxCell>`, 'gs');
    xml = xml.replace(regex, '');
});

fs.writeFileSync('../Untitled Diagram.drawio', xml);
console.log('Fixed REMUNERATION drawio fields');
