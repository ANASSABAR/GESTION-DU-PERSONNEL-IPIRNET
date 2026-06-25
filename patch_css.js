const fs = require('fs');
const path = './public/fiches';

fs.readdirSync(path)
  .filter(f => f.startsWith('fiche-') && f.endsWith('.html'))
  .forEach(f => {
    let c = fs.readFileSync(`${path}/${f}`, 'utf8');
    
    // Replace the specific @media print rule
    c = c.replace(/@media print\s*\{\s*\.print-actions\s*\{\s*display:\s*none;\s*\}/g, `@media print {
    button,
    .btn,
    .print-btn,
    .no-print {
        display: none !important;
    }
    .print-actions {
        display: none !important;
    }`);
    
    // Add no-print class to the button
    c = c.replace(/class="print-btn"/g, 'class="print-btn no-print"');
    
    fs.writeFileSync(`${path}/${f}`, c);
    console.log(`Updated ${f}`);
  });
