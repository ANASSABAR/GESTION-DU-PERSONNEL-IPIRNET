const fs = require('fs');

let xml = fs.readFileSync('../Untitled Diagram.drawio', 'utf8');

const personnelIds = ['lvmcdifN8ZaSqd9waPCC-19', 'tpld4RKiCmXbqXidu6UA-14', 'sbCplAC6uyjUM8z5woQD-66'];
const absencesIds = ['lvmcdifN8ZaSqd9waPCC-11', 'tpld4RKiCmXbqXidu6UA-8', 'sbCplAC6uyjUM8z5woQD-61'];
const heuresIds = ['lvmcdifN8ZaSqd9waPCC-8', 'tpld4RKiCmXbqXidu6UA-5', 'sbCplAC6uyjUM8z5woQD-55'];
const remunIds = ['lvmcdifN8ZaSqd9waPCC-1', 'tpld4RKiCmXbqXidu6UA-1', 'sbCplAC6uyjUM8z5woQD-48'];
const docIds = ['lvmcdifN8ZaSqd9waPCC-28', 'tpld4RKiCmXbqXidu6UA-21', 'sbCplAC6uyjUM8z5woQD-84'];

// Replace specific property values
function updateCell(xmlStr, parentIds, oldVal, newVal) {
    parentIds.forEach(pid => {
        const regex = new RegExp(`(<mxCell[^>]+parent="${pid}"[^>]+value=")${oldVal}( *(\\(.*?\\))?"[^>]*><\\/mxCell>)`, 's');
        xmlStr = xmlStr.replace(regex, `$1${newVal}$2`);
    });
    return xmlStr;
}

// Rename columns directly
xml = updateCell(xml, personnelIds, 'type_contrat', 'contrat');
xml = updateCell(xml, personnelIds, 'salaire_net', 'salaire_base');
xml = updateCell(xml, remunIds, 'nb_heures_supp', 'quantite_heures_supp');
xml = updateCell(xml, remunIds, 'prix_heure_supp', 'prix_unitaire_heure');
xml = updateCell(xml, remunIds, 'montant_heures_supp', 'montant_total_heures_supp');
xml = updateCell(xml, remunIds, 'deduction', 'deduction_cnss');

// For appending cells, we need the exact previous xml replace script logic
function appendCellsAfter(xmlStr, parentIds, anchorVal, newVals) {
    parentIds.forEach(pid => {
        const regex = new RegExp(`(<mxCell[^>]+parent="${pid}"[^>]+value="${anchorVal}".*?<\\/mxCell>)`, 's');
        const match = xmlStr.match(regex);
        if (match) {
            let originalCell = match[1];
            let yMatch = originalCell.match(/y="(\d+)"/);
            let baseY = yMatch ? parseInt(yMatch[1], 10) : 0;
            
            let newCellsStr = '';
            newVals.forEach((nv, idx) => {
                let cellId = `NEW_${pid}_${anchorVal}_${idx}_v3`;
                let newY = baseY + 20 * (idx + 1);
                
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

// Add nombre_jours and motif to ABSENCE
xml = appendCellsAfter(xml, absencesIds, 'date_fin', ['nombre_jours', 'motif']);

// Add prix_heure to HEURE_SUPPLEMENTAIRE (after nombre_heures)
// Be careful to not duplicate if already appended by previous scripts
xml = xml.replace(/<mxCell[^>]+value="contrat"[^>]+><\/mxCell>\n?/g, ''); // Remove incorrectly added 'contrat' previously
xml = appendCellsAfter(xml, heuresIds, 'nombre_heures', ['prix_heure']);

// Check if id_personnel, id_absence, id_heure_sup, id_remuneration exist in DOCUMENT_PERSONNEL
xml = appendCellsAfter(xml, docIds, 'chemin_fichier', ['id_personnel', 'id_absence', 'id_heure_sup', 'id_remuneration']);

fs.writeFileSync('../Untitled Diagram.drawio', xml);
console.log('Drawio updated successfully.');
