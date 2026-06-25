const db = require('./db');
const bcrypt = require('bcryptjs');

async function migrate() {
    try {
        console.log('Suppression de l\'ancienne table UTILISATEUR...');
        await db.query('DROP TABLE IF EXISTS UTILISATEUR');

        console.log('Création de la nouvelle table UTILISATEUR...');
        await db.query(`
            CREATE TABLE UTILISATEUR (
                id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
                nom_utilisateur VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                mot_de_passe VARCHAR(255) NOT NULL,
                id_personnel INT NOT NULL,
                statut_compte ENUM('Actif', 'Bloqué') DEFAULT 'Actif',
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_user_personnel FOREIGN KEY (id_personnel) REFERENCES PERSONNEL(id_personnel) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('Hashage du mot de passe par défaut (Ipirnet2026!)...');
        const hashedPassword = await bcrypt.hash('Ipirnet2026!', 10);

        console.log('Récupération des personnels...');
        const [personnels] = await db.query(`
            SELECT p.id_personnel, p.nom, p.prenom, c.libelle_categorie 
            FROM PERSONNEL p 
            JOIN CATEGORIE c ON p.id_categorie = c.id_categorie
        `);

        const usersToCreate = [
            { role: 'Administration', email: 'admin@ipirnet.com', prefix: 'Admin' },
            { role: 'Secrétaire', email: 'secretaire@ipirnet.com', prefix: 'Secretariat' },
            { role: 'Formateur', email: 'formateur@ipirnet.com', prefix: 'Formateur' },
            { role: 'Responsable pédagogique', email: 'responsable@ipirnet.com', prefix: 'Responsable' }
        ];

        for (const u of usersToCreate) {
            const p = personnels.find(pers => pers.libelle_categorie === u.role);
            if (p) {
                const nomUtilisateur = `${u.prefix} ${p.prenom} ${p.nom}`;
                await db.query(`
                    INSERT INTO UTILISATEUR (nom_utilisateur, email, mot_de_passe, id_personnel)
                    VALUES (?, ?, ?, ?)
                `, [nomUtilisateur, u.email, hashedPassword, p.id_personnel]);
                console.log(`Utilisateur créé : ${u.email} (Lié à ${p.prenom} ${p.nom})`);
            } else {
                console.log(`Aucun personnel trouvé pour la catégorie ${u.role}. L'utilisateur ${u.email} n'a pas été créé.`);
            }
        }

        console.log('Migration terminée avec succès !');
        process.exit(0);
    } catch (err) {
        console.error('Erreur lors de la migration:', err);
        process.exit(1);
    }
}

migrate();
