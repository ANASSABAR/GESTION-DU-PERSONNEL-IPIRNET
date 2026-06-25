const router = require('express').Router();
const db = require('../db');
const { isValidDate, validate } = require('./dateValidator');

const VALID_TYPES = [
  'Livret Individuel', 'Planning Prévisionnel', 'Emploi du Temps', 'Module de Formation', 'Données de Diplômes',
  'Fiche Personnel', 'Fiche Absence', 'Fiche Heures Supplémentaires',
  'Bulletin de Paie', 'Rapport Personnel Global', 'Rapport Absences Global',
  'Document Administratif', 'Évaluation Personnel'
];

const ROLE_DOCS = {
  'Administration': VALID_TYPES,
  'Secrétaire': [
    'Planning Prévisionnel', 'Emploi du Temps', 'Livret Individuel', 'Document Administratif',
    'Fiche Personnel', 'Fiche Absence'
  ],
  'Formateur': [
    'Emploi du Temps', 'Module de Formation', 'Planning Prévisionnel', 'Évaluation Personnel'
  ],
  'Responsable pédagogique': [
    'Livret Individuel', 'Planning Prévisionnel', 'Emploi du Temps', 'Module de Formation', 'Données de Diplômes', 'Évaluation Personnel'
  ]
};

function getAllowedDocs(role) {
    return ROLE_DOCS[role] || [];
}


router.get('/', async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id_personnel;

    // Administration sees all documents
    if (role === 'Administration') {
      const [rows] = await db.query(`
        SELECT d.*, IF(p.id_personnel IS NOT NULL, CONCAT(p.nom, ' ', p.prenom), 'Système') AS nom_complet
        FROM document_personnel d
        LEFT JOIN personnel p ON d.id_personnel = p.id_personnel
        ORDER BY d.date_depot DESC
      `);
      return res.json(rows);
    }

    // Secrétaire sees all personnel's documents, but filtered by their allowed types
    if (role === 'Secrétaire') {
      const allowedTypes = getAllowedDocs(role);
      if (allowedTypes.length === 0) return res.json([]);
      const questionMarks = allowedTypes.map(() => '?').join(',');
      const [rows] = await db.query(`
        SELECT d.*, IF(p.id_personnel IS NOT NULL, CONCAT(p.nom, ' ', p.prenom), 'Système') AS nom_complet
        FROM document_personnel d
        LEFT JOIN personnel p ON d.id_personnel = p.id_personnel
        WHERE d.type_document IN (${questionMarks})
        ORDER BY d.date_depot DESC
      `, allowedTypes);
      return res.json(rows);
    }

    // All other roles: only their own documents, filtered by allowed types
    const allowedTypes = getAllowedDocs(role);
    if (allowedTypes.length === 0) return res.json([]);

    const questionMarks = allowedTypes.map(() => '?').join(',');
    const [rows] = await db.query(`
      SELECT d.*, CONCAT(p.nom, ' ', p.prenom) AS nom_complet
      FROM document_personnel d
      JOIN personnel p ON d.id_personnel = p.id_personnel
      WHERE d.id_personnel = ?
        AND d.type_document IN (${questionMarks})
      ORDER BY d.date_depot DESC
    `, [userId, ...allowedTypes]);

    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/absence/:id_document', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, a.*, p.nom, p.prenom, CONCAT(p.nom, ' ', p.prenom) AS nom_complet
      FROM document_personnel d
      JOIN absence a ON d.id_absence = a.id_absence
      JOIN personnel p ON a.id_personnel = p.id_personnel
      WHERE d.id_document = ?`, [req.params.id_document]);
    
    if (rows.length === 0) {
        return res.status(404).json({ error: "Absence liée introuvable" });
    }
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, 
        p.nom, p.prenom, p.cin, p.contrat, p.salaire_base, p.adresse,
        CONCAT(p.nom, ' ', p.prenom) AS nom_complet
      FROM document_personnel d
      LEFT JOIN personnel p ON d.id_personnel = p.id_personnel
      WHERE d.id_document = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Document introuvable" });
    
    // Check permission
    if (req.user.role === 'Formateur' && rows[0].id_personnel !== req.user.id_personnel) {
      return res.status(403).json({ error: 'Accès interdit.' });
    }
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/save-editor', async (req, res) => {
  try {
    const { id_document, contenu_html } = req.body;
    if (!id_document || !contenu_html) return res.status(400).json({ error: "Données manquantes." });

    // Fetch the document to verify it exists and check ownership
    const [docRows] = await db.query(
      'SELECT id_document, id_personnel, type_document FROM document_personnel WHERE id_document = ?',
      [id_document]
    );
    if (docRows.length === 0) return res.status(404).json({ error: "Document introuvable." });

    const doc = docRows[0];

    // Only Administration can save any document; others can only save their own
    if (req.user.role !== 'Administration' && doc.id_personnel !== req.user.id_personnel) {
      return res.status(403).json({ error: "Accès interdit : vous ne pouvez modifier que vos propres documents." });
    }

    // Secrétaire cannot save WYSIWYG documents
    if (req.user.role === 'Secrétaire') {
      return res.status(403).json({ error: "Accès interdit." });
    }

    await db.query(
      'UPDATE document_personnel SET contenu_html=? WHERE id_document=?',
      [contenu_html, id_document]
    );
    res.json({ success: true, type_document: doc.type_document });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


router.post('/generate-manual', async (req, res) => {
  try {
    const d = req.body;
    const manualTypes = [
      'Livret Individuel', 'Planning Prévisionnel', 'Emploi du Temps', 
      'Module de Formation', 'Données de Diplômes'
    ];
    if (!manualTypes.includes(d.type_document)) {
      return res.status(400).json({ error: "Type de document manuel invalide." });
    }
    let allowedTypes = getAllowedDocs(req.user.role);
    if (!allowedTypes.includes(d.type_document)) {
      return res.status(403).json({ error: "Vous n'avez pas l'autorisation de créer ce document." });
    }
    if (req.user.role === 'Secrétaire' && ['Fiche Personnel', 'Fiche Absence'].includes(d.type_document)) {
      return res.status(403).json({ error: "Vous n'avez pas l'autorisation de générer ce document (lecture seule)." });
    }
    
    const contenuJson = d.contenu_json ? JSON.stringify(d.contenu_json) : null;
    
    // For manual documents, we also support PUT via the same route if an ID is provided
    if (d.id_document) {
      if (req.user.role === 'Secrétaire') return res.status(403).json({ error: 'Accès interdit.' });
      await db.query(
        'UPDATE document_personnel SET type_document=?, date_depot=?, id_personnel=?, contenu_json=? WHERE id_document=?',
        [d.type_document, d.date_depot, d.id_personnel || null, contenuJson, d.id_document]
      );
    } else {
      await db.query(
        'INSERT INTO document_personnel (type_document, date_depot, id_personnel, contenu_json) VALUES (?,?,?,?)',
        [d.type_document, d.date_depot, d.id_personnel || null, contenuJson]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    
    if (req.user.role === 'Formateur' && parseInt(d.id_personnel) !== req.user.id_personnel) {
      return res.status(403).json({ error: 'Vous ne pouvez ajouter un document que pour vous-même.' });
    }

    const err = validate([
      isValidDate(d.date_depot, { label: 'Date de dépôt', minYear: 2000, maxYear: 2099, notFuture: true }),
    ]);
    if (err) return res.status(400).json({ error: err });
    if (!VALID_TYPES.includes(d.type_document)) {
      return res.status(400).json({ error: "Type de document invalide." });
    }
    
    let allowedTypes = getAllowedDocs(req.user.role);
    if (!allowedTypes.includes(d.type_document)) {
      return res.status(403).json({ error: "Vous n'avez pas l'autorisation de créer ce type de document." });
    }
    if (req.user.role === 'Secrétaire' && ['Fiche Personnel', 'Fiche Absence'].includes(d.type_document)) {
      return res.status(403).json({ error: "Vous n'avez pas l'autorisation de créer ce document (lecture seule)." });
    }

    await db.query(
      'INSERT INTO document_personnel (type_document, date_depot, id_personnel, id_absence, id_heure_sup, id_remuneration) VALUES (?,?,?,?,?,?)',
      [d.type_document, d.date_depot, d.id_personnel || null, d.id_absence || null, d.id_heure_sup || null, d.id_remuneration || null]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    
    if (req.user.role === 'Secrétaire') {
      const secReadOnly = ['Fiche Personnel', 'Fiche Absence'];
      if (secReadOnly.includes(d.type_document)) {
        return res.status(403).json({ error: 'Accès interdit. Vous ne pouvez pas modifier ce type de document.' });
      }
      // Also check if the existing document is read-only
      const [docRows] = await db.query('SELECT type_document FROM document_personnel WHERE id_document = ?', [req.params.id]);
      if (docRows.length > 0 && secReadOnly.includes(docRows[0].type_document)) {
        return res.status(403).json({ error: 'Accès interdit. Document en lecture seule.' });
      }
    }
    
    if (req.user.role === 'Formateur') {
      const [docRows] = await db.query('SELECT id_personnel FROM document_personnel WHERE id_document = ?', [req.params.id]);
      if (docRows.length === 0 || docRows[0].id_personnel !== req.user.id_personnel) {
        return res.status(403).json({ error: 'Accès interdit ou document introuvable.' });
      }
      d.id_personnel = req.user.id_personnel; // Force le sien
    }
    


    const err = validate([
      isValidDate(d.date_depot, { label: 'Date de dépôt', minYear: 2000, maxYear: 2099, notFuture: true }),
    ]);
    if (err) return res.status(400).json({ error: err });
    if (!VALID_TYPES.includes(d.type_document)) {
      return res.status(400).json({ error: "Type de document invalide." });
    }

    let allowedTypes = getAllowedDocs(req.user.role);
    if (!allowedTypes.includes(d.type_document)) {
      return res.status(403).json({ error: "Vous n'avez pas l'autorisation de modifier ce type de document." });
    }

    await db.query(
      'UPDATE document_personnel SET type_document=?, date_depot=?, id_personnel=?, id_absence=?, id_heure_sup=?, id_remuneration=? WHERE id_document=?',
      [d.type_document, d.date_depot, d.id_personnel || null, d.id_absence || null, d.id_heure_sup || null, d.id_remuneration || null, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role === 'Secrétaire') {
      const secReadOnly = ['Fiche Personnel', 'Fiche Absence'];
      const [docRows] = await db.query('SELECT type_document FROM document_personnel WHERE id_document = ?', [req.params.id]);
      if (docRows.length > 0 && secReadOnly.includes(docRows[0].type_document)) {
        return res.status(403).json({ error: 'Accès interdit. Document en lecture seule.' });
      }
    }
    if (req.user.role === 'Formateur') {
      const [docRows] = await db.query('SELECT id_personnel FROM document_personnel WHERE id_document = ?', [req.params.id]);
      if (docRows.length === 0 || docRows[0].id_personnel !== req.user.id_personnel) {
        return res.status(403).json({ error: 'Accès interdit ou document introuvable.' });
      }
    }
    await db.query('DELETE FROM document_personnel WHERE id_document=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
