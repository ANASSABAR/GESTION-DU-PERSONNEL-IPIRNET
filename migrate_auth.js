const db = require('./db');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        console.log("Starting Auth Migration...");

        // 1. Ensure all personnel have an email and a cin
        console.log("Updating missing emails and CINs in PERSONNEL...");
        const [personnel] = await db.query('SELECT * FROM PERSONNEL');
        for (const p of personnel) {
            let email = p.email;
            let cin = p.cin;
            let needsUpdate = false;
            
            if (!email) {
                email = `${p.prenom.toLowerCase()}.${p.nom.toLowerCase()}${p.id_personnel}@ipirnet.com`;
                needsUpdate = true;
            }
            if (!cin) {
                cin = `ID${p.id_personnel}${Math.floor(Math.random() * 1000)}`;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await db.query('UPDATE PERSONNEL SET email = ?, cin = ? WHERE id_personnel = ?', [email, cin, p.id_personnel]);
                console.log(`Updated personnel ${p.id_personnel}: ${email} / ${cin}`);
            }
        }

        // 2. Check for "ANAS SABAR" as admin
        const [anasRows] = await db.query('SELECT * FROM PERSONNEL WHERE email = ?', ['anassabar37@gmail.com']);
        if (anasRows.length === 0) {
            console.log("Creating Admin ANAS SABAR...");
            const [catRows] = await db.query('SELECT id_categorie FROM CATEGORIE WHERE libelle_categorie = "Administration" LIMIT 1');
            let idCat = 1;
            if (catRows.length > 0) idCat = catRows[0].id_categorie;
            else {
                const [catInsert] = await db.query('INSERT INTO CATEGORIE (libelle_categorie) VALUES ("Administration")');
                idCat = catInsert.insertId;
            }

            await db.query(`
                INSERT INTO PERSONNEL (nom, prenom, email, cin, id_categorie, statut)
                VALUES ('SABAR', 'Anas', 'anassabar37@gmail.com', 'WA327513', ?, 'Actif')
            `, [idCat]);
        } else {
            console.log("Admin ANAS SABAR already exists.");
        }

        // 3. Update PERSONNEL table constraints
        console.log("Fixing duplicate CINs...");
        const [dupCins] = await db.query('SELECT cin, COUNT(*) as c FROM PERSONNEL GROUP BY cin HAVING c > 1');
        for (const row of dupCins) {
            const [dups] = await db.query('SELECT id_personnel FROM PERSONNEL WHERE cin = ?', [row.cin]);
            // Keep first, change rest
            for (let i = 1; i < dups.length; i++) {
                const newCin = row.cin + '_' + i;
                await db.query('UPDATE PERSONNEL SET cin = ? WHERE id_personnel = ?', [newCin, dups[i].id_personnel]);
                console.log(`Changed duplicate CIN for id ${dups[i].id_personnel} to ${newCin}`);
            }
        }

        console.log("Applying UNIQUE constraints to PERSONNEL...");
        try { await db.query('ALTER TABLE PERSONNEL DROP INDEX uq_personnel_email'); } catch(e){}
        try { await db.query('ALTER TABLE PERSONNEL DROP INDEX uq_personnel_cin'); } catch(e){}
        
        await db.query('ALTER TABLE PERSONNEL MODIFY email VARCHAR(150) NOT NULL');
        await db.query('ALTER TABLE PERSONNEL ADD CONSTRAINT uq_personnel_email UNIQUE (email)');
        
        await db.query('ALTER TABLE PERSONNEL MODIFY cin VARCHAR(50) NOT NULL');
        await db.query('ALTER TABLE PERSONNEL ADD CONSTRAINT uq_personnel_cin UNIQUE (cin)');

        // 4. Drop and Recreate UTILISATEUR table
        console.log("Recreating UTILISATEUR table...");
        await db.query('DROP TABLE IF EXISTS UTILISATEUR');
        await db.query(`
            CREATE TABLE UTILISATEUR (
                id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
                id_personnel INT NOT NULL UNIQUE,
                email VARCHAR(150) NOT NULL UNIQUE,
                mot_de_passe VARCHAR(255) NOT NULL,
                role VARCHAR(100) NOT NULL,
                statut_compte ENUM('Actif', 'Bloqué') DEFAULT 'Actif',
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_user_personnel FOREIGN KEY (id_personnel) REFERENCES PERSONNEL(id_personnel) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Populate UTILISATEUR table
        console.log("Populating UTILISATEUR table...");
        const [allPers] = await db.query(`
            SELECT p.*, c.libelle_categorie 
            FROM PERSONNEL p 
            JOIN CATEGORIE c ON p.id_categorie = c.id_categorie
        `);
        for (const p of allPers) {
            const hashedPwd = await bcrypt.hash(p.cin, 10);
            await db.query(`
                INSERT INTO UTILISATEUR (id_personnel, email, mot_de_passe, role)
                VALUES (?, ?, ?, ?)
            `, [p.id_personnel, p.email, hashedPwd, p.libelle_categorie]);
            console.log(`Created user account for ${p.email}`);
        }

        console.log("Migration completed successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit();
    }
}

run();
