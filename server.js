// ============================================================
//  server.js  —  IPIRNET Gestion du Personnel
//  Démarrage : node server.js   (ou npm start)
//  Prérequis  : XAMPP MySQL en cours + base gestion_personnel créée
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const personnelRoutes    = require('./routes/personnel');
const categorieRoutes    = require('./routes/categories');
const absenceRoutes      = require('./routes/absences');
const heuresRoutes       = require('./routes/heures');
const evaluationRoutes   = require('./routes/evaluations');
const remunerationRoutes = require('./routes/remunerations');
const documentRoutes     = require('./routes/documents');

const dashboardRoutes    = require('./routes/dashboard');
const authRoutes         = require('./routes/auth');
const authMiddleware     = require('./middleware/auth');
const checkRole          = require('./middleware/roles');
const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
// sendBeacon sends Content-Type: text/plain — parse and convert to JSON for /save-editor
app.use(express.text({ type: 'text/plain', limit: '10mb' }));
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.startsWith('{')) {
    try { req.body = JSON.parse(req.body); } catch(e) {}
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/personnel',    authMiddleware, checkRole(['Secrétaire', 'Responsable pédagogique', 'Formateur']), personnelRoutes);
app.use('/api/categories',   authMiddleware, checkRole([]), categorieRoutes);
app.use('/api/absences',     authMiddleware, checkRole(['Secrétaire', 'Responsable pédagogique']), absenceRoutes);
app.use('/api/heures',       authMiddleware, checkRole(['Secrétaire']), heuresRoutes);
app.use('/api/evaluations',  authMiddleware, checkRole(['Responsable pédagogique', 'Formateur']), evaluationRoutes);
app.use('/api/remunerations',authMiddleware, checkRole(['Secrétaire']), remunerationRoutes);
app.use('/api/documents',    authMiddleware, checkRole(['Secrétaire', 'Responsable pédagogique', 'Formateur']), documentRoutes);

app.use('/api/dashboard',    authMiddleware, dashboardRoutes);

app.get('/livret', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fiches', 'livret.html'));
});
app.get('/planning', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fiches', 'planning.html'));
});
app.get('/emploi', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'fiches', 'emploi.html')
    );
});
app.get('/module', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'fiches', 'module.html')
    );
});
app.get('/diplome', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'fiches', 'diplome.html')
    );
});
app.get('/fiche-personnel', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'fiches', 'fiche-personnel.html')
    );
});
app.get('/fiche-absence', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'fiches', 'fiche-absence.html')
    );
});
app.get('/fiche-heure', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'fiches', 'fiche-heure.html')
    );
});
app.get('/fiche-remuneration', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'fiches', 'fiche-remuneration.html')
    );
});
app.get('/fiche-evaluation', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'fiches', 'fiche-evaluation.html')
    );
});
// ─── SPA fallback ────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`\n✅  Serveur démarré sur http://localhost:${PORT}`);
  console.log('   Assurez-vous que XAMPP MySQL est actif.\n');
});
