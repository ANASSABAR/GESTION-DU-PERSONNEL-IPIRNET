const fs = require('fs');
const path = require('path');

const dir = 'c:/xampp/htdocs/IP/ipirnet-app/public/fiches';
const files = ['livret.html', 'planning.html', 'emploi.html', 'module.html', 'diplome.html'];

const printBtn = `<button class="print-btn" onclick="window.print()">
Imprimer le Livret
</button>\n`;

const printBtnOthers = `<div class="print-actions">
    <button onclick="window.print()">
        Imprimer le Planning
    </button>
</div>\n`;

const livretStaticTable = `<table>

<tr>
    <th>Nom Complet</th>
    <td>Safir Khalid</td>
</tr>

<tr>
    <th>Filière</th>
    <td>Technicien Spécialisé en Développement Informatique</td>
</tr>

<tr>
    <th>Niveau</th>
    <td>2ème Année</td>
</tr>

<tr>
    <th>Année Formation</th>
    <td>2024 / 2025</td>
</tr>

</table>`;

for (const file of files) {
    const fpath = path.join(dir, file);
    if (!fs.existsSync(fpath)) continue;
    let content = fs.readFileSync(fpath, 'utf8');

    // Remove dynamic table
    content = content.replace(/<div id="dynamic-personnel-info".*?<\/div>/s, '');
    
    // Remove script block
    content = content.replace(/<style>\s*@media print.*?<\/script>/s, '');
    
    // Add print button back
    if (file === 'livret.html' && !content.includes('class="print-btn"')) {
        content = content.replace(/(<div class="page">)/, '$1\n\n' + printBtn);
        // Add static table back
        content = content.replace(/(<h1 class="title">.*?<\/h1>)/s, '$1\n\n' + livretStaticTable + '\n');
    } else if (file === 'planning.html' && !content.includes('print-actions')) {
        content = content.replace(/(<body>)/, '$1\n' + printBtnOthers);
    } else if (!content.includes('print-actions') && !content.includes('print-btn')) {
        // generic print button for others if missing
        content = content.replace(/(<body>)/, '$1\n<div class="print-actions">\n    <button onclick="window.print()">\n        Imprimer le document\n    </button>\n</div>\n');
    }

    fs.writeFileSync(fpath, content, 'utf8');
}
console.log('Restored static templates.');
