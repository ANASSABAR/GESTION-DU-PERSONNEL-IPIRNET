const fs = require('fs');
const mysql = require('mysql2/promise');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, BorderStyle } = require('docx');

(async () => {
    try {
        console.log("Connexion à la base de données MySQL...");
        const db = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3307,
            user: 'root',
            database: 'gestion_personnel'
        });

        console.log("Récupération des métadonnées...");
        
        // Exclude views
        const excludedTables = ['v_bilan_absences', 'v_derniere_evaluation', 'v_fiche_personnel', 'v_heures_sup'];
        
        const [columns] = await db.query(`
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                COLUMN_TYPE, 
                IS_NULLABLE, 
                COLUMN_KEY, 
                COLUMN_COMMENT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'gestion_personnel'
        `);

        // Group by table
        const tablesMap = {};
        for (let col of columns) {
            if (excludedTables.includes(col.TABLE_NAME)) continue;
            if (!tablesMap[col.TABLE_NAME]) {
                tablesMap[col.TABLE_NAME] = [];
            }
            tablesMap[col.TABLE_NAME].push(col);
        }

        console.log(`Trouvé ${Object.keys(tablesMap).length} tables réelles.`);

        // Build document
        const sections = [];
        
        // Title
        sections.push(new Paragraph({
            text: "Dictionnaire de Données - Gestion du Personnel",
            heading: HeadingLevel.TITLE,
            alignment: "center",
            spacing: { after: 400 }
        }));
        
        sections.push(new Paragraph({
            text: "Ce document présente la structure physique complète et exhaustive de la base de données de l'application IPIRNET, extraite directement de MySQL pour assurer une cohérence totale avec le MCD et le MLD.",
            spacing: { after: 400 }
        }));

        for (const [tableName, cols] of Object.entries(tablesMap)) {
            sections.push(new Paragraph({
                text: `Table : ${tableName.toUpperCase()}`,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }));

            // Table Header
            const headerCells = ["Nom de l'attribut", "Type", "Taille/Détails", "Clé", "Contrainte"].map(text => 
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "4F8EF7" },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                })
            );

            const tableRows = [new TableRow({ children: headerCells, tableHeader: true })];

            for (let col of cols) {
                // Parse Type & Size from COLUMN_TYPE (e.g. varchar(150), int(11), decimal(10,2))
                let type = col.COLUMN_TYPE;
                let size = "-";
                
                const match = type.match(/^([a-z]+)\((.+)\)$/);
                if (match) {
                    type = match[1].toUpperCase();
                    size = match[2];
                } else {
                    type = type.toUpperCase();
                }

                // PK / FK logic
                let key = "";
                if (col.COLUMN_KEY === "PRI") key = "PK";
                else if (col.COLUMN_KEY === "MUL") key = "FK";
                else if (col.COLUMN_KEY === "UNI") key = "UNIQUE";

                // Nullability
                let nullConstraint = col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL";

                const rowCells = [
                    new TableCell({ children: [new Paragraph(col.COLUMN_NAME)], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                    new TableCell({ children: [new Paragraph(type)], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                    new TableCell({ children: [new Paragraph(size)], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: key, bold: key !== "" })] })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                    new TableCell({ children: [new Paragraph(nullConstraint)], margins: { top: 100, bottom: 100, left: 100, right: 100 } })
                ];

                tableRows.push(new TableRow({ children: rowCells }));
            }

            sections.push(new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" }
                }
            }));
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: sections
            }]
        });

        console.log("Création du document Word...");
        const buffer = await Packer.toBuffer(doc);
        const outputPath = 'C:\\xampp\\htdocs\\IP\\Dictionnaire_Donnees_Gestion_Personnel_Final.docx';
        fs.writeFileSync(outputPath, buffer);
        
        console.log("Terminé avec succès ! Fichier sauvegardé sous : " + outputPath);
        await db.end();

    } catch (e) {
        console.error("Erreur fatale:", e);
    }
})();
