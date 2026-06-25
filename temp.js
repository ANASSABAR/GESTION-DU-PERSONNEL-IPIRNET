</script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/fr.js"></script>
<style>
/* ── RESET & VARS ─────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.watermark { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); opacity:0.06; z-index:0; pointer-events:none; width: 600px; }
:root {
  --bg:       #0b101e;
  --surface:  #111827;
  --card:     rgba(31, 41, 55, 0.7);
  --border:   rgba(255, 255, 255, 0.08);
  --accent:   #3B82F6;
  --accent2:  #A78BFA;
  --success:  #10B981;
  --warning:  #F59E0B;
  --danger:   #EF4444;
  --text:     #F9FAFB;
  --muted:    #9CA3AF;
  --sidebar:  240px;
  --radius:   12px;
}
body { font-family:'DM Sans',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
button { font-family:inherit; cursor:pointer; }
input, select, textarea { font-family:inherit; }
a { text-decoration:none; color:inherit; }

/* ── LAYOUT ───────────────────────────────────────────── */
.layout { display:flex; height:100vh; overflow:hidden; }

/* ── SIDEBAR ──────────────────────────────────────────── */
.sidebar {
  width:var(--sidebar); background:var(--surface); border-right:1px solid var(--border);
  display:flex; flex-direction:column; flex-shrink:0; overflow-y:auto;
}
.sidebar-logo {
  padding:24px 20px 16px;
  border-bottom:1px solid var(--border);
}
.sidebar-logo .brand { font-family:'Syne',sans-serif; font-size:20px; font-weight:800;
  background:linear-gradient(135deg,var(--accent),var(--accent2)); -webkit-background-clip:text;
  -webkit-text-fill-color:transparent; }
.sidebar-logo .sub { font-size:11px; color:var(--muted); margin-top:2px; }

.nav-section { padding:16px 16px 4px; font-size:10px; font-weight:600; color:var(--muted);
  text-transform:uppercase; letter-spacing:1px; }
.nav-item {
  display:flex; align-items:center; gap:10px; padding:9px 16px;
  font-size:13px; color:var(--muted); border-left:2px solid transparent;
  cursor:pointer; transition:.15s; border-radius:0 6px 6px 0; margin:1px 8px 1px 0;
}
.nav-item:hover { background:rgba(79,142,247,.08); color:var(--text); }
.nav-item.active { background:rgba(79,142,247,.12); color:var(--accent);
  border-left-color:var(--accent); font-weight:500; }
.nav-icon { font-size:15px; width:18px; text-align:center; }

/* ── MAIN ─────────────────────────────────────────────── */
.main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.topbar {
  background:var(--surface); border-bottom:1px solid var(--border);
  padding:14px 28px; display:flex; align-items:center; justify-content:space-between;
  gap:12px; flex-shrink:0;
}
.topbar h1 { font-family:'Syne',sans-serif; font-size:17px; font-weight:700; }
.topbar-right { display:flex; align-items:center; gap:10px; }
.search-wrap { position:relative; }
.search-wrap input {
  background: rgba(17, 24, 39, 0.5); border: 1px solid var(--border); color: var(--text);
  padding: 7px 12px 7px 32px; border-radius: var(--radius); font-size: 13px; width: 200px;
  transition: .2s;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.search-wrap input:focus { outline: none; border-color: var(--accent); width: 240px; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); background: rgba(17, 24, 39, 0.8); }
.search-wrap::before { content:'🔍'; position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:12px; }

.content { flex:1; overflow-y:auto; padding:28px; }

/* ── BUTTONS ──────────────────────────────────────────── */
.btn { padding:8px 16px; border-radius:var(--radius); border:1px solid var(--border);
  background:transparent; color:var(--text); font-size:13px; transition:.15s; }
.btn:hover { background:var(--border); }
.btn-primary { background:var(--accent); border-color:var(--accent); color:#fff; }
.btn-primary:hover { background:#3a7ae8; }
.btn-danger  { background:var(--danger); border-color:var(--danger); color:#fff; }
.btn-danger:hover { background:#d63030; }
.btn-sm { padding:5px 11px; font-size:12px; }
.btn-icon { padding:6px 10px; font-size:14px; }

/* ── STATS GRID ───────────────────────────────────────── */
.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; margin-bottom:24px; }
.stat-card {
  background:var(--card); border:1px solid var(--border); border-radius:var(--radius);
  padding:18px; position:relative; overflow:hidden;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
}
.stat-card::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(59,130,246,.04),transparent);
}
.stat-label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.stat-value { font-family:'Syne',sans-serif; font-size:28px; font-weight:700; margin:6px 0 2px; }
.stat-sub { font-size:12px; color:var(--muted); }
.stat-up   { color:var(--success); }
.stat-down { color:var(--danger);  }

/* ── CARDS ────────────────────────────────────────────── */
.card { 
  background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; 
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s ease;
}
.card:hover {
  border-color: rgba(167, 139, 250, 0.3);
  box-shadow: 0 4px 20px rgba(167, 139, 250, 0.08);
}
.card + .card { margin-top:16px; }
.card-title { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; margin-bottom:16px; }
.grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }

/* ── TABLE ────────────────────────────────────────────── */
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:11px; font-weight:600; color:var(--muted); text-align:left;
  padding:8px 12px; border-bottom:1px solid var(--border); text-transform:uppercase; letter-spacing:.5px; }
tbody td { padding:12px 12px; font-size:13px; border-bottom:1px solid rgba(42,47,69,.5); vertical-align:middle; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover td { background:rgba(79,142,247,.03); }

/* ── AVATAR ───────────────────────────────────────────── */
.avatar { width:32px; height:32px; border-radius:50%; display:inline-flex; align-items:center;
  justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
.av-a { background:#1e3a5f; color:#4f8ef7; }
.av-b { background:#1a3a2a; color:#22c55e; }
.av-c { background:#3a1e4a; color:#a855f7; }
.av-d { background:#3a2a1a; color:#f59e0b; }
.person-cell { display:flex; align-items:center; gap:10px; }
.person-name { font-size:13px; font-weight:500; }
.person-email { font-size:11px; color:var(--muted); }

/* ── BADGES ───────────────────────────────────────────── */
.badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:600; }
.b-success { background:rgba(34,197,94,.15); color:var(--success); }
.b-warning { background:rgba(245,158,11,.15); color:var(--warning); }
.b-danger  { background:rgba(239,68,68,.15);  color:var(--danger);  }
.b-info    { background:rgba(79,142,247,.15); color:var(--accent);  }
.b-purple  { background:rgba(124,92,252,.15); color:var(--accent2); }

/* ── SECTION HEADER ───────────────────────────────────── */
.section-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; gap:12px; flex-wrap:wrap; }
.hdr-left { display:flex; align-items:center; gap:10px; }

/* ── MODAL ────────────────────────────────────────────── */
.modal-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:1000;
  display:flex; align-items:center; justify-content:center; padding:20px;
  opacity:0; pointer-events:none; transition:.2s;
}
.modal-overlay.open { opacity:1; pointer-events:all; }
.modal {
  background:var(--card); border:1px solid var(--border); border-radius:14px;
  width:100%; max-width:560px; max-height:90vh; overflow-y:auto;
  transform:translateY(20px); transition:.2s;
}
.modal-overlay.open .modal { transform:translateY(0); }
.modal-head { display:flex; align-items:center; justify-content:space-between;
  padding:18px 22px; border-bottom:1px solid var(--border); }
.modal-head h3 { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; }
.modal-close { background:none; border:none; color:var(--muted); font-size:20px; line-height:1;
  cursor:pointer; padding:2px 6px; border-radius:4px; }
.modal-close:hover { background:var(--border); color:var(--text); }
.modal-body { padding:22px; }
.modal-foot { display:flex; gap:10px; justify-content:flex-end;
  padding:16px 22px; border-top:1px solid var(--border); }

/* ── FORM ─────────────────────────────────────────────── */
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-group { display:flex; flex-direction:column; gap:5px; }
.form-group.full { grid-column:1/-1; }
.form-group label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.form-group input, .form-group select, .form-group textarea {
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid var(--border); color: var(--text);
  padding: 9px 12px; border-radius: 8px; font-size: 13px; transition: .2s;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  background: rgba(17, 24, 39, 0.8);
}
.form-group select option { background:var(--card); }
.form-group textarea { resize:vertical; min-height:80px; }

/* ── TOAST ────────────────────────────────────────────── */
#toast-container { position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:8px; }
.toast {
  background:var(--card); border:1px solid var(--border); border-radius:10px;
  padding:12px 18px; font-size:13px; min-width:220px; animation:slideIn .2s ease;
  display:flex; align-items:center; gap:10px;
}
.toast.success { border-color:var(--success); }
.toast.error   { border-color:var(--danger);  }
@keyframes slideIn { from { transform:translateX(40px); opacity:0; } }

/* ── BAR CHART ────────────────────────────────────────── */
.bar-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; font-size:12px; }
.bar-label { width:180px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bar-track { flex:1; height:6px; background:var(--border); border-radius:99px; overflow:hidden; }
.bar-fill  { height:100%; border-radius:99px; background:linear-gradient(90deg,var(--accent),var(--accent2)); transition:.5s; }
.bar-count { width:28px; text-align:right; color:var(--text); font-weight:500; }

/* ── NOTE STARS ───────────────────────────────────────── */
.note { display:inline-flex; align-items:center; gap:4px; font-weight:600; }
.note.high { color:var(--success); }
.note.mid  { color:var(--warning); }
.note.low  { color:var(--danger);  }

/* ── EMPTY STATE ──────────────────────────────────────── */
.empty-state { text-align:center; padding:48px 20px; color:var(--muted); }
.empty-state .icon { font-size:36px; margin-bottom:10px; }
.empty-state p { font-size:14px; }

/* ── LOADER ───────────────────────────────────────────── */
.loader { display:flex; justify-content:center; padding:40px; }
.spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--accent);
  border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* ── CONFIRM ──────────────────────────────────────────── */
.confirm-box { background:var(--card); border:1px solid var(--danger); border-radius:12px;
  padding:24px; text-align:center; max-width:380px; }
.confirm-box h4 { font-family:'Syne',sans-serif; margin-bottom:8px; }
.confirm-box p  { font-size:13px; color:var(--muted); margin-bottom:18px; }
.confirm-actions { display:flex; gap:10px; justify-content:center; }

/* ── SCROLLBAR ────────────────────────────────────────── */
::-webkit-scrollbar { width:5px; height:5px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--border); border-radius:99px; }
/* ── FLATPICKR DARK THEME OVERRIDE ───────────────────── */
.flatpickr-input {
  width: 100%; padding: 9px 12px; background: var(--surface);
  border: 1px solid var(--border); border-radius: 8px;
  color: var(--text); font-family: 'DM Sans', sans-serif;
  font-size: 14px; cursor: pointer;
}
.flatpickr-input:focus { outline: none; border-color: var(--accent); }
.flatpickr-calendar { background: var(--card) !important; border: 1px solid var(--border) !important;
  box-shadow: 0 8px 32px rgba(0,0,0,.5) !important; border-radius: 12px !important; font-family: 'DM Sans',sans-serif !important; }
.flatpickr-months { background: var(--surface) !important; border-radius: 12px 12px 0 0 !important; }
.flatpickr-month, .flatpickr-current-month, .flatpickr-monthDropdown-months,
.flatpickr-next-month svg, .flatpickr-prev-month svg { color: var(--text) !important; fill: var(--text) !important; }
.flatpickr-weekday { color: var(--muted) !important; }
.flatpickr-day { color: var(--text) !important; border-radius: 6px !important; }
.flatpickr-day:hover { background: var(--border) !important; border-color: transparent !important; }
.flatpickr-day.selected, .flatpickr-day.selected:hover { background: var(--accent) !important;
  border-color: var(--accent) !important; color: #fff !important; }
.flatpickr-day.today { border-color: var(--accent) !important; color: var(--accent) !important; font-weight: 600; }
.flatpickr-day.today.selected { color: #fff !important; }
.flatpickr-day.prevMonthDay, .flatpickr-day.nextMonthDay { color: var(--muted) !important; opacity: 0.5; }
.flatpickr-input[readonly] { cursor: pointer; }

/* ── FICHE DE CONSULTATION INDIVIDUELLE ─────────────────── */
.fiche-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.fiche-header {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(79,142,247,.08), rgba(124,92,252,.08));
  border: 1px solid var(--border);
  padding: 20px;
  border-radius: 12px;
  position: relative;
}
.fiche-header-logo {
  position: absolute;
  top: 15px;
  right: 15px;
  height: 25px;
  opacity: 0.6;
}
.fiche-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(79,142,247,.2);
}
.fiche-title-area h2 {
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}
.fiche-title-area p {
  font-size: 12px;
  color: var(--muted);
}
.fiche-sections {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 500px) {
  .fiche-sections {
    grid-template-columns: 1fr 1fr;
  }
}
.fiche-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}
.fiche-section-title {
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
}
.fiche-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(42,47,69,0.3);
}
.fiche-item:last-child {
  border-bottom: none;
}
.fiche-item-label {
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.fiche-item-val {
  font-weight: 600;
  color: var(--text);
}
.fiche-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
</head>
<body>

<!-- Watermark IPIRNET -->
<img src="/assets/logo-ipirnet.png" class="watermark" alt="IPIRNET">

<!-- TOAST -->
<div id="toast-container" style="z-index: 9999;"></div>

<!-- LAYOUT -->
<div class="layout" style="position:relative; z-index:1;">

  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-logo" style="text-align: center; padding: 30px 20px 20px;">
      <img src="/assets/logo-ipirnet.png" alt="IPIRNET" style="width: 115px; margin-bottom: 16px;">
      <div style="font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; line-height: 1.2; color: #F9FAFB;">
        IPIRNET<br/>
        <span style="font-size: 18px; background: linear-gradient(135deg, #60A5FA, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Gestion du Personnel</span>
      </div>
    </div>
    <nav id="sidebar-nav">
      <div class="nav-section">Principal</div>
      <div class="nav-item active" data-page="dashboard"><span class="nav-icon">◈</span> Tableau de bord</div>
      <div class="nav-item" data-page="personnel"><span class="nav-icon">◉</span> Personnel</div>
      <div class="nav-section">Ressources Humaines</div>
      <div class="nav-item" data-page="absences"><span class="nav-icon">◷</span> Absences</div>
      <div class="nav-item" data-page="heures"><span class="nav-icon">⊕</span> Heures supp.</div>
      <div class="nav-item" data-page="remunerations"><span class="nav-icon">◈</span> Rémunérations</div>
      <div class="nav-section">Suivi</div>
      <div class="nav-item" data-page="evaluations"><span class="nav-icon">◎</span> Évaluations</div>
      <div class="nav-item" data-page="documents"><span class="nav-icon">📁</span> Documents Administratifs</div>
      <div class="nav-section">Paramètres</div>
      <div class="nav-item" data-page="categories"><span class="nav-icon">◇</span> Catégories</div>
    </nav>
  </aside>

  <!-- MAIN -->
  <div class="main">
    <div class="topbar">
      <div style="display:flex; align-items:center; gap:15px;">
        <h1 id="page-title">Tableau de bord</h1>
      </div>
      <div class="topbar-right">
        <img src="/assets/Logo-accreditation.png" alt="ACCREDITES" style="height:35px; margin-right:15px;">
        <div class="search-wrap" id="search-wrap" style="display:none">
          <input type="text" id="search-input" placeholder="Rechercher..." />
        </div>
        <button class="btn btn-primary" id="btn-add" style="display:none" onclick="openAddModal()">+ Ajouter</button>
        <button class="btn btn-logout" onclick="logout()" style="display: inline-flex; align-items: center; gap: 6px; border-color: rgba(239, 68, 68, 0.4); color: var(--danger);"><span style="font-size:12px">🚪</span> Déconnexion</button>
      </div>
    </div>
    <div class="content" id="content-area">


...
      <div class="loader"><div class="spinner"></div></div>
    </div>
  </div>
</div>

<!-- MODAL -->
<div class="modal-overlay" id="modal-overlay" onclick="closeModalOnBg(event)">
  <div class="modal" id="modal">
    <div class="modal-head">
      <h3 id="modal-title">Formulaire</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body" id="modal-body"></div>
    <div class="modal-foot" id="modal-foot">
      <button class="btn" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" id="modal-save" onclick="saveForm()">Enregistrer</button>
    </div>
  </div>
</div>

<script>