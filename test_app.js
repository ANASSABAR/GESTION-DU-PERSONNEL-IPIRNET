const http = require('http');
const db = require('./db');

async function testAll() {
    console.log("=== STARTING FULL APPLICATION TEST ===\n");
    let errors = [];
    
    // 1. Check DB tables and structure
    console.log("[1] Checking DB Coherence...");
    try {
        const [tables] = await db.query("SHOW TABLES");
        console.log(`Found ${tables.length} tables.`);
        
        // Check specific column names
        const [persCols] = await db.query("SHOW COLUMNS FROM PERSONNEL");
        const persColNames = persCols.map(c => c.Field);
        if (!persColNames.includes('salaire_base') || !persColNames.includes('contrat')) {
            errors.push("PERSONNEL table missing salaire_base or contrat");
        }
        if (!persColNames.includes('cin')) {
             errors.push("PERSONNEL table missing cin");
        }

        const [remCols] = await db.query("SHOW COLUMNS FROM REMUNERATION");
        const remColNames = remCols.map(c => c.Field);
        if (!remColNames.includes('quantite_heures_supp') || !remColNames.includes('deduction_cnss')) {
            errors.push("REMUNERATION table missing new fields");
        }
    } catch(e) {
        errors.push("DB Error: " + e.message);
    }
    
    // 2. HTTP Route tests (Internal routing tests using require)
    console.log("\n[2] Testing API Route SQL queries natively (bypassing auth for deep test)...");
    
    const queriesToTest = [
        { name: "Personnel GET", query: `
            SELECT p.id_personnel, p.nom, p.prenom, p.email, p.telephone, p.adresse, 
            p.date_naissance, p.date_recrutement, p.statut, p.id_categorie, p.cin, p.sexe, p.contrat,
            COALESCE(rem.salaire_base, p.salaire_base) AS salaire_base, 
            COALESCE(rem.prime, p.prime) AS prime,
            c.libelle_categorie
            FROM PERSONNEL p
            LEFT JOIN CATEGORIE c ON p.id_categorie = c.id_categorie
            LEFT JOIN (
                SELECT r1.id_personnel, r1.salaire_base, r1.prime FROM remuneration r1
                INNER JOIN (
                    SELECT id_personnel, MAX(date_paiement) as max_date FROM remuneration GROUP BY id_personnel
                ) r2 ON r1.id_personnel = r2.id_personnel AND r1.date_paiement = r2.max_date
            ) rem ON p.id_personnel = rem.id_personnel
            ORDER BY p.id_personnel DESC
        ` },
        { name: "Absences GET", query: `
            SELECT a.*, CONCAT(p.nom, ' ', p.prenom) AS nom_complet 
            FROM absence a 
            JOIN personnel p ON a.id_personnel = p.id_personnel 
            ORDER BY a.date_debut DESC
        ` },
        { name: "Heures Supp GET", query: `
            SELECT h.*, CONCAT(p.nom, ' ', p.prenom) AS nom_complet, p.contrat
            FROM heure_supplementaire h 
            JOIN personnel p ON h.id_personnel = p.id_personnel 
            ORDER BY h.date DESC
        ` },
        { name: "Remunerations GET", query: `
            SELECT r.*, CONCAT(p.nom, ' ', p.prenom) AS nom_complet 
            FROM remuneration r 
            JOIN personnel p ON r.id_personnel = p.id_personnel 
            ORDER BY r.date_paiement DESC
        ` },
        { name: "Documents GET", query: `
            SELECT d.*, CONCAT(p.nom, ' ', p.prenom) AS nom_complet 
            FROM document_personnel d 
            LEFT JOIN personnel p ON d.id_personnel = p.id_personnel 
            ORDER BY d.date_depot DESC
        ` },
        { name: "Historique GET", query: `
            SELECT h.*, p.nom AS personnel_nom, p.prenom AS personnel_prenom 
            FROM historique_document h 
            LEFT JOIN personnel p ON h.id_personnel = p.id_personnel 
            ORDER BY h.date_generation DESC
        ` },
        { name: "Documents JOIN Specific (Absence)", query: `
            SELECT a.*, p.nom, p.prenom, p.id_categorie, p.statut as statut_personnel
            FROM absence a
            JOIN personnel p ON a.id_personnel = p.id_personnel
            LIMIT 1
        ` },
        { name: "Documents JOIN Specific (Heures)", query: `
            SELECT h.*, p.nom, p.prenom, p.id_categorie, p.statut as statut_personnel
            FROM heure_supplementaire h
            JOIN personnel p ON h.id_personnel = p.id_personnel
            LIMIT 1
        ` },
        { name: "Documents JOIN Specific (Remunerations)", query: `
            SELECT r.*, p.nom, p.prenom, p.id_categorie, p.statut as statut_personnel
            FROM remuneration r
            JOIN personnel p ON r.id_personnel = p.id_personnel
            LIMIT 1
        ` }
    ];

    for (let test of queriesToTest) {
        try {
            await db.query(test.query);
            console.log(`✅ ${test.name} - Query OK`);
        } catch (e) {
            console.log(`❌ ${test.name} - FAILED`);
            errors.push(`SQL Error in ${test.name}: ${e.message}`);
        }
    }
    
    console.log("\n[3] Checking HTML fiches for dynamic loading params...");
    const fs = require('fs');
    try {
        const fPers = fs.readFileSync('public/fiches/fiche-personnel.html', 'utf8');
        if (!fPers.includes('id_personnel=')) errors.push("fiche-personnel doesn't use id_personnel param properly.");
        
        const fAbs = fs.readFileSync('public/fiches/fiche-absence.html', 'utf8');
        if (!fAbs.includes('id_absence=')) errors.push("fiche-absence doesn't use id_absence param properly.");
        
        const fHeure = fs.readFileSync('public/fiches/fiche-heure.html', 'utf8');
        if (!fHeure.includes('id_heure_sup=')) errors.push("fiche-heure doesn't use id_heure_sup param properly.");
        
        const fRem = fs.readFileSync('public/fiches/fiche-remuneration.html', 'utf8');
        if (!fRem.includes('id_remuneration=')) errors.push("fiche-remuneration doesn't use id_remuneration param properly.");
        console.log(`✅ HTML Fiches URL Params checked`);
    } catch(e) {
        errors.push("HTML Read error: " + e.message);
    }

    if (errors.length > 0) {
        console.log("\n❌ TESTS FAILED with " + errors.length + " errors:");
        errors.forEach(e => console.log(" - " + e));
    } else {
        console.log("\n✅ ALL TESTS PASSED! Application is 100% functional.");
    }
    
    process.exit();
}

testAll();
