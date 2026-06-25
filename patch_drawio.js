const fs = require('fs');

let xml = fs.readFileSync('../Untitled Diagram.drawio', 'utf8');

const personnelIds = ['lvmcdifN8ZaSqd9waPCC-19', 'tpld4RKiCmXbqXidu6UA-14', 'sbCplAC6uyjUM8z5woQD-66'];
const heuresIds = ['lvmcdifN8ZaSqd9waPCC-8', 'tpld4RKiCmXbqXidu6UA-5', 'sbCplAC6uyjUM8z5woQD-55'];
const remunIds = ['lvmcdifN8ZaSqd9waPCC-1', 'tpld4RKiCmXbqXidu6UA-1', 'sbCplAC6uyjUM8z5woQD-48'];

// Function to replace a specific property in a specific parent table
function updateCell(xmlStr, parentIds, oldVal, newVal) {
    parentIds.forEach(pid => {
        const regex = new RegExp(`(<mxCell[^>]+parent="${pid}"[^>]+value=")${oldVal}(".*?<\/mxCell>)`, 's');
        xmlStr = xmlStr.replace(regex, `$1${newVal}$2`);
    });
    return xmlStr;
}

// Function to find a cell and append new sibling cells to the XML right after it
function appendCellsAfter(xmlStr, parentIds, anchorVal, newVals) {
    parentIds.forEach(pid => {
        const regex = new RegExp(`(<mxCell[^>]+parent="${pid}"[^>]+value="${anchorVal}".*?<\/mxCell>)`, 's');
        const match = xmlStr.match(regex);
        if (match) {
            let originalCell = match[1];
            // Get the Y coordinate of the anchor cell
            let yMatch = originalCell.match(/y="(\d+)"/);
            let baseY = yMatch ? parseInt(yMatch[1], 10) : 0;
            
            let newCellsStr = '';
            newVals.forEach((nv, idx) => {
                let cellId = `NEW_${pid}_${anchorVal}_${idx}`;
                let newY = baseY + 20 * (idx + 1);
                
                // Copy the original cell, change ID, Value, and Y geometry
                let newCell = originalCell.replace(/id="[^"]+"/, `id="${cellId}"`)
                                          .replace(/value="[^"]+"/, `value="${nv}"`)
                                          .replace(/y="\d+"/, `y="${newY}"`);
                newCellsStr += '\n' + newCell;
            });
            
            xmlStr = xmlStr.replace(regex, `${match[1]}${newCellsStr}`);
        }
    });
    return xmlStr;
}

// 1. PERSONNEL
// Delete PRIME and heures_supp (rename to empty or specific text, or remove the tags entirely)
// Actually, let's remove the tags entirely using regex:
personnelIds.forEach(pid => {
    xml = xml.replace(new RegExp(`\\s*<mxCell[^>]+parent="${pid}"[^>]+value="prime".*?<\\/mxCell>`, 'gs'), '');
    xml = xml.replace(new RegExp(`\\s*<mxCell[^>]+parent="${pid}"[^>]+value="heures_supp".*?<\\/mxCell>`, 'gs'), '');
});

xml = updateCell(xml, personnelIds, 'type_contrat', 'contrat (CDI, CDD, STAGE, INTERIM)');
xml = updateCell(xml, personnelIds, 'salaire_net', 'salaire_net (sync)');


// 2. HEURE_SUPPLEMENTAIRE
// Append contrat, prix_heure, motif
// Find an existing field, e.g., 'nombre_heures'
xml = appendCellsAfter(xml, heuresIds, 'nombre_heures', [
    'contrat',
    'prix_heure',
    'motif (liste fixe)'
]);

// 3. REMUNERATION
// Append quantite_heures_supp, prix_unitaire_heure, montant_total_heures_supp, deduction_cnss
// 'salaire_net' already exists in REMUNERATION. Wait, let's check what exists first!
xml = appendCellsAfter(xml, remunIds, 'salaire_base', [
    'quantite_heures_supp',
    'prix_unitaire_heure',
    'montant_total_heures_supp',
    'deduction_cnss'
]);

// Let's add the formula as a text cell inside the REMUNERATION table
xml = appendCellsAfter(xml, remunIds, 'salaire_net', [
    '-- Formule --',
    'Net = Base + Prime',
    '+ HS - CNSS'
]);

fs.writeFileSync('../Untitled Diagram.drawio', xml);
console.log('Update finished.');
