-- ============================================================
--  Base de données : Gestion du Personnel
--  Conforme au MCD / MLD fourni
--  Compatible XAMPP / MySQL 5.7+
-- ============================================================

-- Suppression et re-création propre de la base
DROP DATABASE IF EXISTS `gestion_personnel`;
CREATE DATABASE `gestion_personnel`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gestion_personnel`;

-- ============================================================
--  1. CATEGORIE
--     Entité indépendante (0,N) ──── Appartient a ──── (1,1) PERSONNEL
-- ============================================================
CREATE TABLE `CATEGORIE` (
  `id_categorie`      INT          NOT NULL AUTO_INCREMENT,
  `libelle_categorie` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id_categorie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  2. PERSONNEL  (table centrale)
--     FK vers CATEGORIE
-- ============================================================
CREATE TABLE `PERSONNEL` (
  `id_personnel`    INT          NOT NULL AUTO_INCREMENT,
  `nom`             VARCHAR(100) NOT NULL,
  `prenom`          VARCHAR(100) NOT NULL,
  `date_naissance`  DATE             NULL,
  `telephone`       VARCHAR(20)      NULL,
  `email`           VARCHAR(150)     NULL,
  `adresse`         TEXT             NULL,
  `date_recrutement` DATE            NULL,
  `statut`          ENUM('Actif','Essai','Congé','Inactif') NOT NULL DEFAULT 'Actif',
  `id_categorie`    INT          NOT NULL,
  PRIMARY KEY (`id_personnel`),
  UNIQUE KEY `uq_personnel_email` (`email`),
  KEY `fk_pers_categorie` (`id_categorie`),
  CONSTRAINT `fk_pers_categorie`
    FOREIGN KEY (`id_categorie`) REFERENCES `CATEGORIE` (`id_categorie`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  3. DOCUMENT_PERSONNEL
--     (1,1) ──── Possède ──── (N,0) PERSONNEL
-- ============================================================
CREATE TABLE `DOCUMENT_PERSONNEL` (
  `id_document`    INT          NOT NULL AUTO_INCREMENT,
  `type_document`  ENUM('Fiche Personnel', 'Fiche Absence', 'Fiche Heures Supplémentaires', 'Bulletin de Paie', 'Rapport Personnel Global', 'Rapport Absences Global', 'Rapport Heures Supplémentaires Global', 'Rapport Rémunérations Global', 'Document Administratif', 'Évaluation Personnel', 'Historique Document') NOT NULL,
  `date_depot`     DATE             NULL,
  `chemin_fichier` VARCHAR(255)     NULL,
  `id_personnel`   INT          NOT NULL,
  `id_absence`     INT              NULL,
  PRIMARY KEY (`id_document`),
  KEY `fk_doc_personnel` (`id_personnel`),
  CONSTRAINT `fk_doc_personnel`
    FOREIGN KEY (`id_personnel`) REFERENCES `PERSONNEL` (`id_personnel`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  KEY `fk_doc_absence` (`id_absence`),
  CONSTRAINT `fk_doc_absence`
    FOREIGN KEY (`id_absence`) REFERENCES `ABSENCE` (`id_absence`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  4. ABSENCE
--     (1,1) ──── a ──── (N,0) PERSONNEL
--     Statut conforme au MLD : En attente / Justifiée / Non justifiée
-- ============================================================
CREATE TABLE `ABSENCE` (
  `id_absence`   INT          NOT NULL AUTO_INCREMENT,
  `date_debut`   DATE         NOT NULL,
  `date_fin`     DATE         NOT NULL,
  `type_absence` VARCHAR(100)     NULL,
  `statut`       ENUM('En attente','Justifiée','Non justifiée') NOT NULL DEFAULT 'En attente',
  `id_personnel` INT          NOT NULL,
  PRIMARY KEY (`id_absence`),
  KEY `fk_abs_personnel` (`id_personnel`),
  CONSTRAINT `fk_abs_personnel`
    FOREIGN KEY (`id_personnel`) REFERENCES `PERSONNEL` (`id_personnel`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  5. HEURE_SUPPLEMENTAIRE
--     (1,1) ──── effectue ──── (N,0) PERSONNEL
-- ============================================================
CREATE TABLE `HEURE_SUPPLEMENTAIRE` (
  `id_heure_sup`  INT           NOT NULL AUTO_INCREMENT,
  `date`          DATE          NOT NULL,
  `nombre_heures` DECIMAL(5,2)  NOT NULL,
  `motif`         VARCHAR(255)      NULL,
  `id_personnel`  INT           NOT NULL,
  PRIMARY KEY (`id_heure_sup`),
  KEY `fk_hs_personnel` (`id_personnel`),
  CONSTRAINT `fk_hs_personnel`
    FOREIGN KEY (`id_personnel`) REFERENCES `PERSONNEL` (`id_personnel`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  6. EVALUATION_PERSONNEL
--     (1,1) ──── reçoit ──── (N,0) PERSONNEL
-- ============================================================
CREATE TABLE `EVALUATION_PERSONNEL` (
  `id_evaluation`  INT          NOT NULL AUTO_INCREMENT,
  `date_evaluation` DATE            NULL,
  `note`           DECIMAL(4,2)    NULL,
  `commentaire`    TEXT            NULL,
  `id_personnel`   INT          NOT NULL,
  PRIMARY KEY (`id_evaluation`),
  KEY `fk_eval_personnel` (`id_personnel`),
  CONSTRAINT `fk_eval_personnel`
    FOREIGN KEY (`id_personnel`) REFERENCES `PERSONNEL` (`id_personnel`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  7. REMUNERATION
--     (1,1) ──── reçoit ──── (N,0) PERSONNEL
--     salaire_net est calculé automatiquement (colonne générée)
-- ============================================================
CREATE TABLE `REMUNERATION` (
  `id_remuneration` INT           NOT NULL AUTO_INCREMENT,
  `salaire_base`    DECIMAL(10,2) NOT NULL,
  `prime`           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantite_heures_supp`  DECIMAL(5,2)  DEFAULT 0.00,
  `prix_unitaire_heure` DECIMAL(10,2) DEFAULT 0.00,
  `montant_total_heures_supp` DECIMAL(10,2) GENERATED ALWAYS AS (`quantite_heures_supp` * `prix_unitaire_heure`) STORED,
  `deduction_cnss`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `salaire_base` DECIMAL(10,2) GENERATED ALWAYS AS (`salaire_base` + `prime` + `montant_total_heures_supp` - `deduction_cnss`) STORED,
  `date_paiement`   DATE              NULL,
  `id_personnel`    INT           NOT NULL,
  PRIMARY KEY (`id_remuneration`),
  KEY `fk_rem_personnel` (`id_personnel`),
  CONSTRAINT `fk_rem_personnel`
    FOREIGN KEY (`id_personnel`) REFERENCES `PERSONNEL` (`id_personnel`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  DONNÉES DE TEST
-- ============================================================

-- 1. Catégories
INSERT INTO `CATEGORIE` (`libelle_categorie`) VALUES
  ('Formateur'),
  ('Secrétaire'),
  ('Responsable pédagogique'),
  ('Administration');

-- 2. Personnel
INSERT INTO `PERSONNEL`
  (`nom`, `prenom`, `date_naissance`, `telephone`, `email`, `adresse`, `date_recrutement`, `statut`, `id_categorie`)
VALUES
  ('Mansouri', 'Ahmed',   '1985-03-12', '0661000001', 'ahmed@gestion.ma',   '12 Rue Hassan II, Safi',    '2025-04-15', 'Actif',   1),
  ('Benali',   'Sara',    '1992-07-25', '0661000002', 'sara@gestion.ma',    '5 Avenue Mohammed V, Safi', '2025-04-01', 'Actif',   2),
  ('Elhani',   'Youssef', '1988-11-08', '0661000003', 'youssef@gestion.ma', '8 Bd Zerktouni, Marrakech', '2025-03-20', 'Essai',   3),
  ('Ouali',    'Fatima',  '1990-05-17', '0661000004', 'fatima@gestion.ma',  '3 Rue Ibn Batouta, Safi',   '2025-01-10', 'Congé',   1);

-- 3. Documents
INSERT INTO `DOCUMENT_PERSONNEL` (`type_document`, `date_depot`, `chemin_fichier`, `id_personnel`) VALUES
  ('Contrat', '2025-04-15', '/docs/mansouri_contrat.pdf', 1),
  ('Diplôme', '2025-04-15', '/docs/mansouri_diplome.pdf', 1),
  ('CV',      '2025-04-01', '/docs/benali_cv.pdf',        2),
  ('Contrat', '2025-03-20', '/docs/elhani_contrat.pdf',   3);

-- 4. Absences
INSERT INTO `ABSENCE` (`date_debut`, `date_fin`, `type_absence`, `statut`, `id_personnel`) VALUES
  ('2025-04-20', '2025-04-22', 'Maladie',   'Justifiée',     2),
  ('2025-04-25', '2025-04-25', 'Personnel', 'Non justifiée', 1),
  ('2025-04-28', '2025-04-30', 'Formation', 'En attente',    3);

-- 5. Heures supplémentaires
INSERT INTO `HEURE_SUPPLEMENTAIRE` (`date`, `nombre_heures`, `motif`, `id_personnel`) VALUES
  ('2025-04-10', 4.00, 'Examen fin d''année',  1),
  ('2025-04-15', 3.00, 'Réunion pédagogique',  3),
  ('2025-04-20', 6.00, 'Révision programme',   4);

-- 6. Évaluations
INSERT INTO `EVALUATION_PERSONNEL` (`date_evaluation`, `note`, `commentaire`, `id_personnel`) VALUES
  ('2025-03-10', 17.00, 'Excellent travail, très impliqué', 1),
  ('2025-03-12', 13.00, 'Bonne organisation, à améliorer',  2);

-- 7. Rémunérations
INSERT INTO `REMUNERATION` (`salaire_base`, `prime`, `deduction_cnss`, `date_paiement`, `id_personnel`) VALUES
  (4500.00, 500.00, 320.00, '2025-05-30', 1),
  (3200.00, 200.00, 218.00, '2025-05-30', 2),
  (5000.00, 800.00, 390.00, '2025-05-30', 3),
  (3800.00, 300.00, 260.00, '2025-05-30', 4);


-- ============================================================
--  VUES UTILES
-- ============================================================

-- Fiche complète du personnel
CREATE OR REPLACE VIEW `v_fiche_personnel` AS
SELECT
  p.`id_personnel`,
  CONCAT(p.`nom`, ' ', p.`prenom`)  AS `nom_complet`,
  c.`libelle_categorie`             AS `categorie`,
  p.`email`,
  p.`telephone`,
  p.`adresse`,
  p.`date_naissance`,
  p.`date_recrutement`,
  p.`statut`,
  r.`salaire_base`,
  r.`prime`,
  r.`deduction_cnss`,
  r.`salaire_net`,
  r.`date_paiement`
FROM `PERSONNEL` p
JOIN `CATEGORIE` c ON p.`id_categorie` = c.`id_categorie`
LEFT JOIN `REMUNERATION` r ON r.`id_personnel` = p.`id_personnel`;

-- Bilan des absences par personne
CREATE OR REPLACE VIEW `v_bilan_absences` AS
SELECT
  p.`id_personnel`,
  CONCAT(p.`nom`, ' ', p.`prenom`)                           AS `nom_complet`,
  COUNT(a.`id_absence`)                                       AS `total_absences`,
  SUM(DATEDIFF(a.`date_fin`, a.`date_debut`) + 1)            AS `jours_absents`,
  SUM(a.`statut` = 'Non justifiée')                           AS `non_justifiees`
FROM `PERSONNEL` p
LEFT JOIN `ABSENCE` a ON a.`id_personnel` = p.`id_personnel`
GROUP BY p.`id_personnel`, `nom_complet`;

-- Total heures supplémentaires par personne
CREATE OR REPLACE VIEW `v_heures_sup` AS
SELECT
  p.`id_personnel`,
  CONCAT(p.`nom`, ' ', p.`prenom`) AS `nom_complet`,
  SUM(h.`nombre_heures`)            AS `total_heures_sup`
FROM `PERSONNEL` p
LEFT JOIN `HEURE_SUPPLEMENTAIRE` h ON h.`id_personnel` = p.`id_personnel`
GROUP BY p.`id_personnel`, `nom_complet`;

-- Dernière évaluation par personne
CREATE OR REPLACE VIEW `v_derniere_evaluation` AS
SELECT
  p.`id_personnel`,
  CONCAT(p.`nom`, ' ', p.`prenom`) AS `nom_complet`,
  e.`date_evaluation`,
  e.`note`,
  e.`commentaire`
FROM `PERSONNEL` p
LEFT JOIN `EVALUATION_PERSONNEL` e ON e.`id_personnel` = p.`id_personnel`
WHERE e.`id_evaluation` = (
  SELECT MAX(e2.`id_evaluation`)
  FROM `EVALUATION_PERSONNEL` e2
  WHERE e2.`id_personnel` = p.`id_personnel`
);


