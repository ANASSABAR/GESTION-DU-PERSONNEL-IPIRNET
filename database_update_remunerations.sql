-- 1. Ajout de la colonne num_cnss à la table PERSONNEL
ALTER TABLE `PERSONNEL`
ADD COLUMN `num_cnss` VARCHAR(50) NULL AFTER `id_categorie`;

-- 2. Ajout des colonnes à la table REMUNERATION
ALTER TABLE `REMUNERATION`
ADD COLUMN `amo` DECIMAL(10,2) DEFAULT 0.00 AFTER `deduction_cnss`,
ADD COLUMN `cimr` DECIMAL(10,2) DEFAULT 0.00 AFTER `amo`,
ADD COLUMN `ir` DECIMAL(10,2) DEFAULT 0.00 AFTER `cimr`,
ADD COLUMN `salaire_imposable` DECIMAL(10,2) DEFAULT 0.00 AFTER `ir`,
ADD COLUMN `net_a_payer` DECIMAL(10,2) DEFAULT 0.00 AFTER `salaire_imposable`;

-- 3. Mettre à jour la vue v_fiche_personnel si nécessaire
-- (pas strictement requis, mais on s'assure qu'elle continue de fonctionner avec le num_cnss si on l'y ajoute)
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
  p.`num_cnss`,
  r.`salaire_base`,
  r.`prime`,
  r.`deduction_cnss`,
  r.`salaire_net`,
  r.`net_a_payer`,
  r.`date_paiement`
FROM `PERSONNEL` p
JOIN `CATEGORIE` c ON p.`id_categorie` = c.`id_categorie`
LEFT JOIN `REMUNERATION` r ON r.`id_personnel` = p.`id_personnel`;
