USE `gestion_personnel`;
CREATE TABLE IF NOT EXISTS `HISTORIQUE_DOCUMENT` (
  `id_historique`          INT          NOT NULL AUTO_INCREMENT,
  `type_document`          VARCHAR(100) NOT NULL,
  `nom_document`           VARCHAR(255) NOT NULL,
  `chemin_fichier`         VARCHAR(255) NOT NULL,
  `date_generation`        DATETIME     NOT NULL,
  `module_source`          VARCHAR(100) NOT NULL,
  `id_personnel`           INT              NULL,
  `utilisateur_generation` VARCHAR(150) NOT NULL,
  `statut_document`        ENUM('Généré', 'Imprimé', 'Archivé') NOT NULL DEFAULT 'Généré',
  PRIMARY KEY (`id_historique`),
  KEY `fk_hist_personnel` (`id_personnel`),
  CONSTRAINT `fk_hist_personnel` FOREIGN KEY (`id_personnel`) REFERENCES `PERSONNEL` (`id_personnel`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
