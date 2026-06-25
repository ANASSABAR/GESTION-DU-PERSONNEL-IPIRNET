const fs = require('fs');
const path = require('path');
const db = require('./db');

const queries = [
    // PERSONNEL
    "ALTER TABLE PERSONNEL CHANGE type_contrat contrat VARCHAR(50);",
    "ALTER TABLE PERSONNEL CHANGE salaire_net salaire_base DECIMAL(10,2);",
    "ALTER TABLE PERSONNEL MODIFY cin VARCHAR(20) UNIQUE;",
    
    // ABSENCE
    "ALTER TABLE ABSENCE ADD COLUMN nombre_jours DECIMAL(5,2) NULL AFTER date_fin;",
    "ALTER TABLE ABSENCE ADD COLUMN motif VARCHAR(255) NULL AFTER statut;",
    
    // HEURE_SUPPLEMENTAIRE
    "ALTER TABLE HEURE_SUPPLEMENTAIRE ADD COLUMN prix_heure DECIMAL(10,2) NULL AFTER nombre_heures;",
    
    // REMUNERATION
    "ALTER TABLE REMUNERATION CHANGE nb_heures_supp quantite_heures_supp DECIMAL(5,2);",
    "ALTER TABLE REMUNERATION CHANGE prix_heure_supp prix_unitaire_heure DECIMAL(10,2);",
    "ALTER TABLE REMUNERATION CHANGE montant_heures_supp montant_total_heures_supp DECIMAL(10,2) GENERATED ALWAYS AS (quantite_heures_supp * prix_unitaire_heure) STORED;",
    "ALTER TABLE REMUNERATION CHANGE deduction deduction_cnss DECIMAL(10,2);",
    
    // recreate salaire_net in remuneration to use the new column names
    "ALTER TABLE REMUNERATION MODIFY salaire_net DECIMAL(10,2) GENERATED ALWAYS AS (salaire_base + prime + montant_total_heures_supp - deduction_cnss) STORED;"
];

function replaceInFile(filepath, replacements) {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf-8');
    let orig = content;
    
    for (let r of replacements) {
        content = content.replace(r[0], r[1]);
    }
    
    if (orig !== content) {
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log("Updated", filepath);
    }
}

async function run() {
    for (let q of queries) {
        try {
            await db.query(q);
            console.log("Executed:", q);
        } catch (e) {
            console.error("Error executing:", q, e.message);
        }
    }
    
    const replacements = [
        ['public/index.html', [
            [/type_contrat/g, 'contrat'],
            [/p\.salaire_net/g, 'p.salaire_base'],
            [/d\.salaire_net/g, 'd.salaire_base'],
            [/nb_heures_supp/g, 'quantite_heures_supp'],
            [/prix_heure_supp/g, 'prix_unitaire_heure'],
            [/montant_heures_supp/g, 'montant_total_heures_supp'],
            [/r\.deduction/g, 'r.deduction_cnss'],
            [/d\.deduction/g, 'd.deduction_cnss'],
            [/id:'f-deduction',\s*label:'Déductions'/g, "id:'f-deduction', label:'Déductions CNSS'"]
        ]],
        ['routes/personnel.js', [
            [/type_contrat/g, 'contrat'],
            [/p\.salaire_net/g, 'p.salaire_base'],
            [/d\.salaire_net/g, 'd.salaire_base'],
            [/COALESCE\(rem\.salaire_net, p\.salaire_base\)/g, 'COALESCE(rem.salaire_net, p.salaire_base)'],
            [/rem\.salaire_net, p\.salaire_net/g, 'rem.salaire_net, p.salaire_base'],
            [/COALESCE\(rem\.salaire_net, p\.salaire_net\)\s*AS\s*salaire_net/g, 'COALESCE(rem.salaire_net, p.salaire_base) AS salaire_base'],
            [/AS salaire_net/g, 'AS salaire_base'],
            [/r1\.salaire_net/g, 'r1.salaire_net'],
            [/salaire_net, prime/g, 'salaire_base, prime'],
        ]],
        ['routes/heures.js', [
            [/type_contrat/g, 'contrat'],
            [/INSERT INTO heure_supplementaire \(date, nombre_heures, motif, id_personnel\) VALUES \(\?,\?,\?,\?\)/g, 'INSERT INTO heure_supplementaire (date, nombre_heures, prix_heure, motif, id_personnel) VALUES (?,?,?,?,?)'],
            [/\[d\.date, d\.nombre_heures, d\.motif, d\.id_personnel\]/g, '[d.date, d.nombre_heures, d.prix_heure || 0, d.motif, d.id_personnel]'],
        ]],
        ['routes/absences.js', [
            [/INSERT INTO absence \(date_debut, date_fin, type_absence, statut, id_personnel\) VALUES \(\?,\?,\?,\?,\?\)/g, 'INSERT INTO absence (date_debut, date_fin, type_absence, nombre_jours, statut, motif, id_personnel) VALUES (?,?,?,?,?,?,?)'],
            [/\[d\.date_debut, d\.date_fin, d\.type_absence, d\.statut, d\.id_personnel\]/g, '[d.date_debut, d.date_fin, d.type_absence, d.nombre_jours || 0, d.statut, d.motif, d.id_personnel]'],
            [/UPDATE absence SET date_debut=\?, date_fin=\?, type_absence=\?, statut=\?, id_personnel=\? WHERE id_absence=\?/g, 'UPDATE absence SET date_debut=?, date_fin=?, type_absence=?, nombre_jours=?, statut=?, motif=?, id_personnel=? WHERE id_absence=?'],
            [/\[d\.date_debut, d\.date_fin, d\.type_absence, d\.statut, d\.id_personnel, req\.params\.id\]/g, '[d.date_debut, d.date_fin, d.type_absence, d.nombre_jours || 0, d.statut, d.motif, d.id_personnel, req.params.id]'],
        ]],
        ['routes/remunerations.js', [
            [/nb_heures_supp/g, 'quantite_heures_supp'],
            [/prix_heure_supp/g, 'prix_unitaire_heure'],
            [/d\.deduction/g, 'd.deduction_cnss'],
            [/deduction, date_paiement/g, 'deduction_cnss, date_paiement'],
            [/deduction=\?/g, 'deduction_cnss=?'],
        ]],
        ['public/fiches/fiche-personnel.html', [
            [/type_contrat/g, 'contrat'],
            [/p\.salaire_net/g, 'p.salaire_base'],
        ]],
        ['public/fiches/fiche-heure.html', [
            [/type_contrat/g, 'contrat'],
        ]],
        ['public/fiches/fiche-remuneration.html', [
            [/nb_heures_supp/g, 'quantite_heures_supp'],
            [/prix_heure_supp/g, 'prix_unitaire_heure'],
            [/montant_heures_supp/g, 'montant_total_heures_supp'],
            [/r\.deduction/g, 'r.deduction_cnss'],
        ]],
        ['database.sql', [
            [/type_contrat/g, 'contrat'],
            [/`salaire_net`\s+DECIMAL\(10,2\)\s+NULL/g, '`salaire_base` DECIMAL(10,2) NULL'],
            [/`salaire_net`\s+DECIMAL\(10,2\)/g, '`salaire_base` DECIMAL(10,2)'],
            [/nb_heures_supp/g, 'quantite_heures_supp'],
            [/prix_heure_supp/g, 'prix_unitaire_heure'],
            [/montant_heures_supp/g, 'montant_total_heures_supp'],
            [/`deduction`/g, '`deduction_cnss`'],
            [/`cin`\s+VARCHAR\(20\)\s+NULL/g, '`cin` VARCHAR(20) UNIQUE'],
        ]],
        ['database_final.sql', [
            [/type_contrat/g, 'contrat'],
            [/`salaire_net`\s+DECIMAL\(10,2\)\s+NULL/g, '`salaire_base` DECIMAL(10,2) NULL'],
            [/nb_heures_supp/g, 'quantite_heures_supp'],
            [/prix_heure_supp/g, 'prix_unitaire_heure'],
            [/montant_heures_supp/g, 'montant_total_heures_supp'],
            [/`deduction`/g, '`deduction_cnss`'],
            [/`cin`\s+VARCHAR\(20\)\s+NULL/g, '`cin` VARCHAR(20) UNIQUE'],
        ]],
    ];
    
    for (let item of replacements) {
        replaceInFile(item[0], item[1]);
    }
    
    process.exit();
}

run();
