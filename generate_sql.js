const fs = require('fs');

const sql = `-- ============================================================
--  Base de données : Gestion du Personnel (FINAL)
--  Architecture stable et définitive
--  Généré le : ${new Date().toISOString()}
-- ============================================================

DROP DATABASE IF EXISTS \`gestion_personnel\`;
CREATE DATABASE \`gestion_personnel\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE \`gestion_personnel\`;

-- ============================================================
--  1. CATEGORIE
-- ============================================================
CREATE TABLE \`CATEGORIE\` (
  \`id_categorie\`      INT          NOT NULL AUTO_INCREMENT,
  \`libelle_categorie\` VARCHAR(100) NOT NULL,
  PRIMARY KEY (\`id_categorie\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  2. PERSONNEL
-- ============================================================
CREATE TABLE \`PERSONNEL\` (
  \`id_personnel\`    INT          NOT NULL AUTO_INCREMENT,
  \`nom\`             VARCHAR(100) NOT NULL,
  \`prenom\`          VARCHAR(100) NOT NULL,
  \`email\`           VARCHAR(150)     NULL UNIQUE,
  \`telephone\`       VARCHAR(20)      NULL,
  \`adresse\`         TEXT             NULL,
  \`date_naissance\`  DATE             NULL,
  \`date_recrutement\` DATE            NULL,
  \`cin\`             VARCHAR(20)      NULL,
  \`sexe\`            VARCHAR(10)      NULL,
  \`statut\`          ENUM('Actif','Essai','Congé','Inactif') NOT NULL DEFAULT 'Actif',
  \`type_contrat\`    VARCHAR(50)      NULL,
  \`salaire_net\`     DECIMAL(10,2)    NULL,
  \`prime\`           DECIMAL(10,2)    NULL,
  \`id_categorie\`    INT          NOT NULL,
  PRIMARY KEY (\`id_personnel\`),
  KEY \`fk_pers_categorie\` (\`id_categorie\`),
  CONSTRAINT \`fk_pers_categorie\` FOREIGN KEY (\`id_categorie\`) REFERENCES \`CATEGORIE\` (\`id_categorie\`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  3. HEURE_SUPPLEMENTAIRE
-- ============================================================
CREATE TABLE \`HEURE_SUPPLEMENTAIRE\` (
  \`id_heure_sup\`  INT           NOT NULL AUTO_INCREMENT,
  \`date\`          DATE          NOT NULL,
  \`nombre_heures\` DECIMAL(5,2)  NOT NULL,
  \`motif\`         VARCHAR(255)      NULL,
  \`id_personnel\`  INT           NOT NULL,
  PRIMARY KEY (\`id_heure_sup\`),
  KEY \`fk_hs_personnel\` (\`id_personnel\`),
  CONSTRAINT \`fk_hs_personnel\` FOREIGN KEY (\`id_personnel\`) REFERENCES \`PERSONNEL\` (\`id_personnel\`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  4. REMUNERATION
-- ============================================================
CREATE TABLE \`REMUNERATION\` (
  \`id_remuneration\` INT           NOT NULL AUTO_INCREMENT,
  \`salaire_base\`    DECIMAL(10,2) NOT NULL,
  \`prime\`           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`nb_heures_supp\`  DECIMAL(5,2)  DEFAULT 0.00,
  \`prix_heure_supp\` DECIMAL(10,2) DEFAULT 0.00,
  \`montant_heures_supp\` DECIMAL(10,2) GENERATED ALWAYS AS (\`nb_heures_supp\` * \`prix_heure_supp\`) STORED,
  \`deduction\`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`salaire_net\`     DECIMAL(10,2) GENERATED ALWAYS AS (\`salaire_base\` + \`prime\` + \`montant_heures_supp\` - \`deduction\`) STORED,
  \`date_paiement\`   DATE              NULL,
  \`id_personnel\`    INT           NOT NULL,
  PRIMARY KEY (\`id_remuneration\`),
  KEY \`fk_rem_personnel\` (\`id_personnel\`),
  CONSTRAINT \`fk_rem_personnel\` FOREIGN KEY (\`id_personnel\`) REFERENCES \`PERSONNEL\` (\`id_personnel\`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  5. ABSENCE
-- ============================================================
CREATE TABLE \`ABSENCE\` (
  \`id_absence\`   INT          NOT NULL AUTO_INCREMENT,
  \`date_debut\`   DATE         NOT NULL,
  \`date_fin\`     DATE         NOT NULL,
  \`type_absence\` VARCHAR(100)     NULL,
  \`statut\`       ENUM('En attente','Justifiée','Non justifiée') NOT NULL DEFAULT 'En attente',
  \`id_personnel\` INT          NOT NULL,
  PRIMARY KEY (\`id_absence\`),
  KEY \`fk_abs_personnel\` (\`id_personnel\`),
  CONSTRAINT \`fk_abs_personnel\` FOREIGN KEY (\`id_personnel\`) REFERENCES \`PERSONNEL\` (\`id_personnel\`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  6. EVALUATION_PERSONNEL
-- ============================================================
CREATE TABLE \`EVALUATION_PERSONNEL\` (
  \`id_evaluation\`  INT          NOT NULL AUTO_INCREMENT,
  \`date_evaluation\` DATE            NULL,
  \`note\`           DECIMAL(4,2)    NULL,
  \`commentaire\`    TEXT            NULL,
  \`id_personnel\`   INT          NOT NULL,
  PRIMARY KEY (\`id_evaluation\`),
  KEY \`fk_eval_personnel\` (\`id_personnel\`),
  CONSTRAINT \`fk_eval_personnel\` FOREIGN KEY (\`id_personnel\`) REFERENCES \`PERSONNEL\` (\`id_personnel\`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  7. DOCUMENT_PERSONNEL
-- ============================================================
CREATE TABLE \`DOCUMENT_PERSONNEL\` (
  \`id_document\`    INT          NOT NULL AUTO_INCREMENT,
  \`type_document\`  VARCHAR(100) NOT NULL,
  \`date_depot\`     DATE             NULL,
  \`chemin_fichier\` VARCHAR(255)     NULL,
  \`id_personnel\`   INT          NOT NULL,
  PRIMARY KEY (\`id_document\`),
  KEY \`fk_doc_personnel\` (\`id_personnel\`),
  CONSTRAINT \`fk_doc_personnel\` FOREIGN KEY (\`id_personnel\`) REFERENCES \`PERSONNEL\` (\`id_personnel\`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

fs.writeFileSync('database_final.sql', sql);
console.log('database_final.sql generated!');
