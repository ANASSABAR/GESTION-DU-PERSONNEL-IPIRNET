const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } = require('docx');
const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log("Lancement du navigateur...");
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log("Capture 1 : Tableau de Bord...");
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: 1, email: 'admin@ipirnet.ma', nom: 'Administrateur', role: 'admin' }, 'ipirnet-super-secret-key-2026');
        await page.goto('http://localhost:3000/login.html', { waitUntil: 'networkidle0' });
        await page.evaluate((t) => { localStorage.setItem('token', t); }, token);
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        const dashBuf = await page.screenshot();

        console.log("Capture 2 : Personnel...");
        await page.click('[data-page="personnel"]');
        await new Promise(r => setTimeout(r, 1000));
        const persBuf = await page.screenshot();
        
        console.log("Capture 3 : Formulaire Modal...");
        await page.click('#btn-add');
        await new Promise(r => setTimeout(r, 1000));
        const modalBuf = await page.screenshot();

        await browser.close();

        console.log("Génération du document Word...");
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new Paragraph({ text: "Rapport de Projet : IPIRNET — Gestion du Personnel", heading: HeadingLevel.TITLE }),
                        
                        new Paragraph({ text: "1. Vue d'ensemble", heading: HeadingLevel.HEADING_1 }),
                        new Paragraph("L'application IPIRNET est un système de gestion des ressources humaines (SIRH) complet. L'interface principale, ou Tableau de Bord, offre une vue d'ensemble des statistiques clés de l'entreprise : effectifs, absences, masse salariale et activité récente."),
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: dashBuf,
                                    transformation: { width: 600, height: 375 }
                                })
                            ]
                        }),
                        new Paragraph({ text: "Figure 1 : Le Tableau de bord montrant les indicateurs clés et l'activité récente.", italics: true }),

                        new Paragraph({ text: "2. Gestion du Personnel", heading: HeadingLevel.HEADING_1 }),
                        new Paragraph("La section Personnel permet de visualiser tous les employés enregistrés, filtrer par nom ou catégorie, et accéder aux actions rapides (édition, suppression, génération de fiches)."),
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: persBuf,
                                    transformation: { width: 600, height: 375 }
                                })
                            ]
                        }),
                        new Paragraph({ text: "Figure 2 : La liste du personnel avec les badges de statuts et actions.", italics: true }),

                        new Paragraph({ text: "3. Ajout et Modification (Formulaires Modaux)", heading: HeadingLevel.HEADING_1 }),
                        new Paragraph("L'application utilise des fenêtres modales pour les opérations d'ajout et de modification, permettant une expérience utilisateur fluide sans rechargement de page. Voici l'exemple du formulaire d'ajout d'un nouvel employé."),
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: modalBuf,
                                    transformation: { width: 600, height: 375 }
                                })
                            ]
                        }),
                        new Paragraph({ text: "Figure 3 : Formulaire modal d'ajout de personnel avec champs dynamiques.", italics: true }),

                        new Paragraph({ text: "Conclusion", heading: HeadingLevel.HEADING_1 }),
                        new Paragraph("Ce projet est conçu pour être à la fois robuste côté backend avec Node.js et MySQL, et réactif côté frontend grâce à son architecture SPA (Single Page Application). L'interface premium sombre garantit un confort d'utilisation optimal.")
                    ]
                }
            ]
        });

        const b64string = await Packer.toBuffer(doc);
        fs.writeFileSync('rapport_projet_ipirnet.docx', b64string);
        console.log("Terminé avec succès ! Le rapport est enregistré sous 'rapport_projet_ipirnet.docx'.");
    } catch (e) {
        console.error("Erreur:", e);
    }
})();
