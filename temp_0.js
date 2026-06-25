
// Auth Check
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}

// ── CONFIG & STATE ─────────────────────────────────────────
const API = 'http://localhost:3000/api';
let currentPage = 'dashboard';
let editingId = null;
let modalSaveHandler = null;

// ── API ────────────────────────────────────────────────────
async function api(path, method='GET', body=null) {
  const opts = { 
    method, 
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    } 
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (res.status === 401) {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/login.html';
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'Erreur réseau'}));
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}

// ── TOAST ──────────────────────────────────────────────────
function toast(msg, type='success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type==='success'?'✅':'❌'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── UTILS ──────────────────────────────────────────────────
/**
 * val(id) — Lit la valeur d'un champ.
 * Pour les champs date Flatpickr, retourne la valeur ISO (YYYY-MM-DD)
 * stockée dans data-iso-value, pas le texte affiché (DD/MM/YYYY).
 */
function val(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  // Si c'est un champ flatpickr, lire la valeur ISO stockée
  if (el.classList.contains('flatpickr-input') && el.dataset.isoValue) {
    return el.dataset.isoValue; // format YYYY-MM-DD → envoyé au backend
  }
  return el.value?.trim() || '';
}
function q() { return document.getElementById('search-input')?.value?.trim()||''; }
function avatarColor(name='') { return ['av-a','av-b','av-c','av-d'][(name.charCodeAt(0)||0) % 4]; }
function initials(nom='', prenom='') { return ((nom[0]||'')+(prenom[0]||'')).toUpperCase(); }
/**
 * fmtDate — Affiche une date au format DD/MM/YYYY (fr-FR).
 * Gère : chaîne "YYYY-MM-DD", chaîne ISO complète, et objet Date JS.
 * Jamais de décalage UTC : on parse manuellement la partie date.
 */
function fmtDate(d) {
  if (!d) return '—';
  let str;
  if (d instanceof Date) {
    // objet Date JS → extraire en local pour éviter décalage
    const y = d.getFullYear(), m = d.getMonth()+1, day = d.getDate();
    return `${String(day).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  }
  str = String(d);
  // Extraire YYYY-MM-DD depuis n'importe quel format ISO
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '—';
  return `${match[3]}/${match[2]}/${match[1]}`; // DD/MM/YYYY
}
function fmtMoney(n) { return n==null ? '—' : Number(n).toLocaleString('fr-FR') + ' MAD'; }
function statusBadge(s) {
  const m = {Actif:'b-success',Essai:'b-warning',Congé:'b-info',Inactif:'b-danger'};
  return `<span class="badge ${m[s]||'b-info'}">${s}</span>`;
}
function absBadge(s) {
  const m = {'Justifiée':'b-success','Non justifiée':'b-danger','En attente':'b-warning'};
  return `<span class="badge ${m[s]||'b-info'}">${s}</span>`;
}
function noteBadge(n) {
  if (n==null) return '<span class="badge b-warning">N/A</span>';
  const cls = n>=15?'high':n>=10?'mid':'low';
  return `<span class="note ${cls}">⭐ ${Number(n).toFixed(1)}/20</span>`;
}

// ── VALIDATION DATES ───────────────────────────────────
/**
 * todayISO() — Retourne la date du jour au format YYYY-MM-DD.
 */
function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

function toISODate(val) {
  if (!val) return '';
  const dt = new Date(val);
  if (!isNaN(dt.getTime())) {
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  }
  const match = String(val).match(/(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

/**
 * checkDate(iso, opts) — Valide une date ISO (YYYY-MM-DD).
 * opts: { label, minYear, maxYear, notFuture, notPast }
 * Retourne null si OK, ou une string d'erreur.
 */
function checkDate(iso, opts = {}) {
  if (!iso) return null; // champ optionnel vide = OK
  const { label = 'Date', minYear = 1950, maxYear = 2099, notFuture = false } = opts;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return `${label} : format invalide.`;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (year < minYear) return `${label} : l'année ${year} est trop ancienne (minimum ${minYear}).`;
  if (year > maxYear) return `${label} : l'année ${year} est irréaliste (maximum ${maxYear}).`;
  if (month < 1 || month > 12) return `${label} : mois invalide.`;
  if (day < 1 || day > 31) return `${label} : jour invalide.`;
  if (notFuture && iso > todayISO()) return `${label} ne peut pas être dans le futur.`;
  return null;
}

/**
 * checkOrder(isoA, isoB, labelA, labelB) — Vérifie que A <= B.
 * Retourne null si OK, ou une string d'erreur.
 */
function checkOrder(isoA, isoB, labelA, labelB) {
  if (!isoA || !isoB) return null;
  if (isoA > isoB) return `« ${labelA} » doit être antérieure ou égale à « ${labelB} ».`;
  return null;
}

/**
 * validateDates(checks) — Lance une liste de vérifications.
 * checks : tableau de [erreur|null]
 * Affiche le premier message d'erreur trouvé et retourne false.
 * Retourne true si tout est valide.
 */
function validateDates(checks) {
  for (const err of checks) {
    if (err) { toast(err, 'error'); return false; }
  }
  return true;
}

// ── MODAL FORM BUILDER ─────────────────────────────────────
async function openModalForm(title, fields, saveHandler) {
  const body = fields.map(f => {
    let input = '';
    if (f.type === 'select') {
      const opts = f.options || [];
      input = `<select id="${f.id}">${opts.map(o => `<option value="${o.value}" ${String(f.value) === String(o.value) ? 'selected' : ''}>${o.label}</option>`).join('')}</select>`;
    } else if (f.type === 'textarea') {
      input = `<textarea id="${f.id}" placeholder="${f.placeholder||''}">${f.value||''}</textarea>`;
    } else if (f.type === 'date') {
      // Flatpickr : affiche JJ/MM/AAAA, envoie YYYY-MM-DD via data-isoValue
      input = `<input id="${f.id}" type="text" class="flatpickr-input"
        data-date="${f.value||''}"
        data-mindate="${f.minDate||''}"
        data-maxdate="${f.maxDate||''}"
        placeholder="JJ/MM/AAAA" autocomplete="off" readonly/>`;
    } else {
      input = `<input id="${f.id}" type="${f.type||'text'}" placeholder="${f.placeholder||''}" value="${f.value||''}" ${f.readonly ? 'readonly style="opacity:0.6; cursor:not-allowed;" title="Modification impossible ici"' : ''}/>`;
    }
    const classes = f.fullWidth ? 'form-group full' : 'form-group';
    return `<div class="${classes}"><label>${f.label}</label>${input}</div>`;
  }).join('');

  openModal(title, `<div class="form-grid">${body}</div>`, saveHandler);

  // Initialiser flatpickr sur tous les champs date du modal
  document.querySelectorAll('#modal-body .flatpickr-input').forEach(el => {
    const initDate  = el.dataset.date    || null; // YYYY-MM-DD
    const minDate   = el.dataset.mindate || null;
    const maxDate   = el.dataset.maxdate || null;
    
    // Nettoyage explicite pour éviter tout cache ou autofill du navigateur
    if (!initDate) {
      el.value = '';
      el.dataset.isoValue = '';
    } else {
      el.dataset.isoValue = initDate;
    }

    flatpickr(el, {
      locale: 'fr',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      allowInput: false,
      defaultDate: initDate || null,
      minDate: minDate || null,
      maxDate: maxDate || null,
      onChange: function(selectedDates, dateStr, instance) {
        el.dataset.isoValue = dateStr;
      }
    });
  });
}

// ── MODAL ──────────────────────────────────────────────────
function openModal(title, bodyHTML, saveHandler) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  modalSaveHandler = saveHandler;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() { 
  document.getElementById('modal-overlay').classList.remove('open'); 
  document.getElementById('modal-foot').style.display='flex';
  editingId=null; 
}
function closeModalOnBg(e) { if (e.target===document.getElementById('modal-overlay')) closeModal(); }
async function saveForm() { if (modalSaveHandler) await modalSaveHandler(); }

// ── PAGE ROUTING ───────────────────────────────────────────
const PAGES = {
  dashboard: { title:'Tableau de bord', showSearch:false, showAdd:false, render:renderDashboard },
  personnel: { title:'Gestion du Personnel', showSearch:true, showAdd:true, render:renderPersonnel },
  absences: { title:'Absences', showSearch:true, showAdd:true, render:renderAbsences },
  heures: { title:'Heures supplémentaires', showSearch:true, showAdd:true, render:renderHeures },
  remunerations: { title:'Rémunérations', showSearch:false, showAdd:true, render:renderRemunerations },
  evaluations: { title:'Évaluations', showSearch:false, showAdd:true, render:renderEvaluations },
  documents: { title:'Documents Administratifs', showSearch:false, showAdd:true, render:renderDocuments },
  categories: { title:'Catégories', showSearch:false, showAdd:true, render:renderCategories },
};

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    el.classList.add('active');
    currentPage = el.dataset.page;
    loadPage(currentPage);
  });
});

function loadPage(page) {
  const cfg = PAGES[page];
  document.getElementById('page-title').textContent = cfg.title;
  document.getElementById('search-wrap').style.display = cfg.showSearch ? 'flex' : 'none';
  document.getElementById('btn-add').style.display = cfg.showAdd ? 'inline-flex' : 'none';
  document.getElementById('search-input').value = '';
  if (cfg.render) cfg.render();
}

document.getElementById('search-input').addEventListener('input', () => {
  clearTimeout(window._st);
  window._st = setTimeout(() => loadPage(currentPage), 300);
});

function showLoader() {
  document.getElementById('content-area').innerHTML = '<div class="loader"><div class="spinner"></div></div>';
}
function setContent(html) {
  document.getElementById('content-area').innerHTML = html;
}

// ── RENDER FUNCTIONS ───────────────────────────────────────

// Dashboard
async function renderDashboard() {
  showLoader();
  try {
    const d = await api('/dashboard');
    const maxCat = Math.max(...d.par_categorie.map(c=>c.total), 1);
    const bars = d.par_categorie.map(c=>`
      <div class="bar-row">
        <div class="bar-label">${c.libelle_categorie}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(c.total/maxCat*100).toFixed(0)}%"></div></div>
        <div class="bar-count">${c.total}</div>
      </div>`).join('');

    const recent = d.recent.map(p=>`
      <tr>
        <td><div class="person-cell">
          <div class="avatar ${avatarColor(p.nom)}">${initials(p.nom,p.prenom)}</div>
          <div><div class="person-name">${p.nom} ${p.prenom}</div><div class="person-email">${p.email||''}</div></div>
        </div></td>
        <td>${p.libelle_categorie}</td>
        <td>${fmtDate(p.date_recrutement)}</td>
        <td>${statusBadge(p.statut)}</td>
      </tr>`).join('');

    setContent(`
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Total Personnel</div><div class="stat-value">${d.total_personnel}</div><div class="stat-sub">employés actifs</div></div>
        <div class="stat-card"><div class="stat-label">Absences ce mois</div><div class="stat-value">${d.total_absences}</div><div class="stat-sub stat-down">${d.non_justifiees} non justifiées</div></div>
        <div class="stat-card"><div class="stat-label">Heures supp.</div><div class="stat-value">${Number(d.total_heures).toFixed(1)}h</div><div class="stat-sub">ce mois</div></div>
        <div class="stat-card"><div class="stat-label">Masse salariale</div><div class="stat-value">${Math.round(d.masse_salariale/1000)}k</div><div class="stat-sub">MAD / mois</div></div>
        <div class="stat-card"><div class="stat-label">Évaluations manquantes</div><div class="stat-value stat-down">${d.evals_attente}</div><div class="stat-sub">à compléter</div></div>
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-title">Personnel par catégorie</div>${bars}</div>
        <div class="card"><div class="card-title">Activité récente</div>
          <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">Derniers recrutements</p>
          <div class="table-wrap"><table><thead><tr><th>Nom</th><th>Catégorie</th><th>Recruté le</th><th>Statut</th></tr></thead>
          <tbody>${recent||'<tr><td colspan="4" style="text-align:center;color:var(--muted)">Aucun personnel</td></tr>'}</tbody></table></div>
        </div>
      </div>`);
  } catch(e) { setContent(`<div class="card"><p style="color:var(--danger)">❌ Impossible de charger les données.<br><small>${e.message}</small></p></div>`); }
}

// Personnel
async function renderPersonnel() {
  showLoader();
  try {
    const rows = await api(`/personnel?q=${encodeURIComponent(q())}`);
    const trs = rows.map(p=>`
      <tr>
        <td><div class="person-cell">
          <div class="avatar ${avatarColor(p.nom)}">${initials(p.nom,p.prenom)}</div>
          <div><div class="person-name">${p.nom} ${p.prenom}</div></div>
        </div></td>
        <td><span class="badge b-purple">${p.libelle_categorie||'-'}</span></td>
        <td>${p.telephone||'-'}</td>
        <td>${p.email||'-'}</td>
        <td>${p.adresse||'-'}</td>
        <td>${p.cin||'-'}</td>
        <td class="center">${fmtDate(p.date_naissance)}</td>
        <td>${p.sexe||'-'}</td>
        <td><span class="badge ${p.type_contrat==='CDI'?'b-success':p.type_contrat==='CDD'?'b-warning':p.type_contrat==='STAGE'?'b-info':p.type_contrat==='INTERIM'?'b-purple':'b-secondary'}">${p.type_contrat||'-'}</span></td>
        <td>${p.salaire_net != null ? p.salaire_net + ' MAD' : '-'}</td>
        <td>${p.heures_supp||0} h</td>
        <td>${fmtDate(p.date_recrutement)}</td>
        <td>${statusBadge(p.statut)}</td>
        <td>
          <button class="btn btn-sm btn-icon" onclick="viewPersonnel(${p.id_personnel})" title="Voir les informations">👁️</button>
          <button class="btn btn-sm btn-icon" onclick="openPersonnelModal(${p.id_personnel})">✏️</button>
          <button class="btn btn-sm btn-icon" onclick="deleteRecord('/personnel/${p.id_personnel}','Personnel supprimé',renderPersonnel)">🗑️</button>
        </td>
      </tr>`).join('');

    setContent(`
      <div class="section-hdr"><span class="badge b-info">${rows.length} enregistrement(s)</span></div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Nom</th><th>Catégorie</th><th>Téléphone</th><th>Email</th><th>Adresse</th><th>CIN</th><th>Date naissance</th><th>Sexe</th><th>Contrat</th><th>Salaire</th><th>Heures supp.</th><th>Recrutement</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>${trs||'<tr><td colspan="14"><div class="empty-state"><div class="icon">👤</div><p>Aucun personnel trouvé</p></div></td></tr>'}</tbody>
      </table></div></div>`);
  } catch(e) { setContent(`<p style="color:var(--danger)">${e.message}</p>`); }
}


// Absences
async function renderAbsences() {
  showLoader();
  try {
    const rows = await api(`/absences?q=${encodeURIComponent(q())}`);
    const trs = rows.map(a=>`
      <tr>
        <td>${a.nom_complet}</td>
        <td><span class="badge b-purple">${a.type_absence||'—'}</span></td>
        <td>${fmtDate(a.date_debut)}</td>
        <td>${fmtDate(a.date_fin)}</td>
        <td>${absBadge(a.statut)}</td>
        <td>
          <button class="btn btn-sm btn-icon" onclick="viewAbsence(${a.id_absence})" title="Voir les informations">👁️</button>
          <button class="btn btn-sm btn-icon" onclick="openAbsenceModal(${a.id_absence})">✏️</button>
          <button class="btn btn-sm btn-icon" onclick="deleteRecord('/absences/${a.id_absence}','Absence supprimée',renderAbsences)">🗑️</button>
        </td>
      </tr>`).join('');
    setContent(`
      <div class="section-hdr"><span class="badge b-info">${rows.length} enregistrement(s)</span></div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Personnel</th><th>Type</th><th>Début</th><th>Fin</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>${trs||'<tr><td colspan="6"><div class="empty-state"><div class="icon">📅</div><p>Aucune absence</p></div></td></tr>'}</tbody>
      </table></div></div>`);
  } catch(e) { setContent(`<p style="color:var(--danger)">${e.message}</p>`); }
}

// Heures
async function renderHeures() {
  showLoader();
  try {
    const rows = await api('/heures');
    const trs = rows.map(h=>{
      const contrat = h.type_contrat||'-';
      const bClass = contrat==='CDI'?'b-success':contrat==='CDD'?'b-warning':contrat==='STAGE'?'b-info':contrat==='INTERIM'?'b-purple':'b-secondary';
      const prix = contrat==='CDI' ? 25 : contrat==='CDD' ? 20 : 0;
      return `
      <tr>
        <td>${h.nom_complet}</td>
        <td><span class="badge ${bClass}">${contrat}</span></td>
        <td>${prix} DH/h</td>
        <td>${fmtDate(h.date)}</td>
        <td><strong>${h.nombre_heures}h</strong></td>
        <td>${h.motif||'—'}</td>
        <td>
          <button class="btn btn-sm btn-icon" onclick="viewHeure(${h.id_heure_sup})" title="Voir les informations">👁️</button>
          <button class="btn btn-sm btn-icon" onclick="openHeurModal(${h.id_heure_sup})">✏️</button>
          <button class="btn btn-sm btn-icon" onclick="deleteRecord('/heures/${h.id_heure_sup}','Heure supprimée',renderHeures)">🗑️</button>
        </td>
      </tr>`;
    }).join('');
    setContent(`
      <div class="section-hdr"><span class="badge b-info">${rows.length} enregistrement(s)</span></div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Personnel</th><th>Contrat</th><th>Prix Heure</th><th>Date</th><th>Heures</th><th>Motif</th><th>Actions</th></tr></thead>
        <tbody>${trs||'<tr><td colspan="7"><div class="empty-state"><div class="icon">⏱️</div><p>Aucune heure supplémentaire</p></div></td></tr>'}</tbody>
      </table></div></div>`);
  } catch(e) { setContent(`<p style="color:var(--danger)">${e.message}</p>`); }
}

// Rémunérations
async function renderRemunerations() {
  showLoader();
  try {
    const rows = await api('/remunerations');
    const trs = rows.map(r=>`
      <tr>
        <td>${r.nom_complet}</td>
        <td>${fmtMoney(r.salaire_base)}</td>
        <td style="color:var(--success)">${fmtMoney(r.prime)}</td>
        <td>${r.nb_heures_supp || 0} h</td>
        <td>${fmtMoney(r.prix_heure_supp)}</td>
        <td style="color:var(--success)">${fmtMoney(r.montant_heures_supp)}</td>
        <td style="color:var(--danger)">${fmtMoney(r.deduction)}</td>
        <td><strong>${fmtMoney(r.salaire_net)}</strong></td>
        <td>${fmtDate(r.date_paiement)}</td>
        <td>
          <button class="btn btn-sm btn-icon" onclick="viewRemuneration(${r.id_remuneration})" title="Voir les informations">👁️</button>
          <button class="btn btn-sm btn-icon" onclick="openRemuModal(${r.id_remuneration})">✏️</button>
          <button class="btn btn-sm btn-icon" onclick="deleteRecord('/remunerations/${r.id_remuneration}','Supprimé',renderRemunerations)">🗑️</button>
        </td>
      </tr>`).join('');
    setContent(`
      <div class="section-hdr"><span class="badge b-info">${rows.length} fiche(s)</span></div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Personnel</th><th>Salaire Base</th><th>Prime</th><th>Heures Supplémentaires (Qté)</th><th>Prix Heure Supplémentaire</th><th>Montant Total HS</th><th>Déduction CNSS</th><th>Salaire Net</th><th>Date de Paiement</th><th>Actions</th></tr></thead>
        <tbody>${trs||'<tr><td colspan="10"><div class="empty-state"><div class="icon">💰</div><p>Aucune rémunération</p></div></td></tr>'}</tbody>
      </table></div></div>`);
  } catch(e) { setContent(`<p style="color:var(--danger)">${e.message}</p>`); }
}

// Évaluations
async function renderEvaluations() {
  showLoader();
  try {
    const rows = await api('/evaluations');
    const trs = rows.map(e=>`
      <tr>
        <td>${e.nom_complet}</td>
        <td>${fmtDate(e.date_evaluation)}</td>
        <td>${noteBadge(e.note)}</td>
        <td style="font-size:12px;color:var(--muted);max-width:200px">${e.commentaire||'—'}</td>
        <td>
          <button class="btn btn-sm btn-icon" onclick="viewEvaluation(${e.id_evaluation})" title="Voir les informations">👁️</button>
          <button class="btn btn-sm btn-icon" onclick="openEvalModal(${e.id_evaluation})">✏️</button>
          <button class="btn btn-sm btn-icon" onclick="deleteRecord('/evaluations/${e.id_evaluation}','Supprimé',renderEvaluations)">🗑️</button>
        </td>
      </tr>`).join('');
    setContent(`
      <div class="section-hdr"><span class="badge b-info">${rows.length} évaluation(s)</span></div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Personnel</th><th>Date</th><th>Note</th><th>Commentaire</th><th>Actions</th></tr></thead>
        <tbody>${trs||'<tr><td colspan="5"><div class="empty-state"><div class="icon">📋</div><p>Aucune évaluation</p></div></td></tr>'}</tbody>
      </table></div></div>`);
  } catch(e) { setContent(`<p style="color:var(--danger)">${e.message}</p>`); }
}

// Documents
async function renderDocuments() {
  showLoader();
  try {
    const rows = await api('/documents');
    const trs = rows.map(doc=>{
      const typeMap = {
        'Livret Individuel':'li',
        'Planning Prévisionnel':'pl',
        'Emploi du Temps':'em',
        'Module de Formation':'mo',
        'Données de Diplômes':'di'
      };
      const hasTemplate = typeMap[doc.type_document];
      return `
      <tr>
        <td>${doc.nom_complet}</td>
        <td><span class="badge b-info">${doc.type_document}</span></td>
        <td>${fmtDate(doc.date_depot)}</td>
        <td>
          ${hasTemplate ? `<button class="btn btn-sm btn-icon" onclick="printDocument('${doc.type_document}')" title="Imprimer">🖨️</button>` : ''}
          <button class="btn btn-sm btn-icon" onclick="openDocModal(${doc.id_document})" title="Modifier">✏️</button>
          <button class="btn btn-sm btn-icon" onclick="deleteRecord('/documents/${doc.id_document}','Document supprimé',renderDocuments)" title="Supprimer">🗑️</button>
        </td>
      </tr>`;
    }).join('');
    setContent(`
      <div class="section-hdr"><span class="badge b-info">${rows.length} document(s)</span></div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Personnel</th><th>Type</th><th>Date dépôt</th><th>Actions</th></tr></thead>
        <tbody>${trs||'<tr><td colspan="4"><div class="empty-state"><div class="icon">📁</div><p>Aucun document administratif</p></div></td></tr>'}</tbody>
      </table></div></div>`);
  } catch(e) { setContent(`<p style="color:var(--danger)">${e.message}</p>`); }
}

// Catégories
async function renderCategories() {
  showLoader();
  try {
    const rows = await api('/categories');
    const trs = rows.map(c=>`
      <tr>
        <td><strong>${c.id_categorie}</strong></td>
        <td>${c.libelle_categorie}</td>
        <td>
          <button class="btn btn-sm btn-icon" onclick="openCatModal(${c.id_categorie},'${c.libelle_categorie.replace(/'/g,"\\'")}')">✏️</button>
          <button class="btn btn-sm btn-icon" onclick="deleteRecord('/categories/${c.id_categorie}','Catégorie supprimée',renderCategories)">🗑️</button>
        </td>
      </tr>`).join('');
    setContent(`
      <div class="section-hdr"><span class="badge b-info">${rows.length} catégorie(s)</span></div>
      <div class="card" style="max-width:500px"><div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Libellé</th><th>Actions</th></tr></thead>
        <tbody>${trs}</tbody>
      </table></div></div>`);
  } catch(e) { setContent(`<p style="color:var(--danger)">${e.message}</p>`); }
}

// ── GENERIC FORM MODAL ─────────────────────────────────────
async function openAddModal() {
  const handlers = {
    personnel: openPersonnelModal,
    absences: openAbsenceModal,
    heures: openHeurModal,
    remunerations: openRemuModal,
    evaluations: openEvalModal,
    documents: openDocModal,
    categories: openCatModal,
  };
  if (handlers[currentPage]) return handlers[currentPage]();
}

// Personnel
async function openPersonnelModal(id=null) {
  editingId = id;
  const today = todayISO();
  const catOpts = await getSelectOptions('categories', 'id_categorie', 'libelle_categorie');
  let d = {};
  if (id) d = await api(`/personnel/${id}`);
  const fields = [
    { id:'f-nom',     label:'Nom *',          value:d.nom||'',      placeholder:'Nom de famille' },
    { id:'f-prenom',  label:'Prénom *',        value:d.prenom||'',   placeholder:'Prénom' },
    { id:'f-email',   label:'Email',           type:'email', value:d.email||'', placeholder:'email@exemple.ma' },
    { id:'f-cin',     label:'CIN',             type:'text',  value:d.cin||'',   placeholder:'AB123456' },
    { id:'f-sexe',    label:'Sexe',            type:'select', value:d.sexe||'Homme',
      options:[{value:'Homme',label:'Homme'},{value:'Femme',label:'Femme'}]
    },
    { id:'f-contrat', label:'Type contrat',    type:'select',  value:d.type_contrat||'CDI',
      options:[
        {value:'CDI',label:'CDI'},
        {value:'CDD',label:'CDD'},
        {value:'STAGE',label:'STAGE'},
        {value:'INTERIM',label:'INTERIM'}
      ]
    },
    { id:'f-salaire', label:'Salaire net',      type:'number', value:d.salaire_net||'', readonly:true },
    { id:'f-heures',  label:'Heures supp.',     type:'number', value:d.heures_supp||0, readonly:true },
    { id:'f-tel',     label:'Téléphone',         value:d.telephone||'', placeholder:'06XXXXXXXX' },
    // Date naissance : 1950-01-01 -> aujourd'hui (vide par defaut en mode ajout)
    { id:'f-dn', label:'Date de naissance', type:'date',
      value:toISODate(d.date_naissance) || '',
      minDate:'1950-01-01', maxDate:id ? '2099-12-31' : today },
    // Date recrutement : 2000-01-01 → aujourd'hui
    { id:'f-dr', label:'Date recrutement', type:'date',
      value:toISODate(d.date_recrutement) || (id ? '' : today),
      minDate:'2000-01-01', maxDate:id ? '2099-12-31' : today },
    { id:'f-cat',    label:'Catégorie *', type:'select', value:d.id_categorie||'', options:catOpts },
    { id:'f-statut', label:'Statut',      type:'select', value:d.statut||'Actif',
      options:[{value:'Actif',label:'Actif'},{value:'Essai',label:'Essai'},{value:'Congé',label:'Congé'},{value:'Inactif',label:'Inactif'}] },
    { id:'f-adresse', label:'Adresse', type:'textarea', value:d.adresse||'', fullWidth:true },
  ];
  await openModalForm(id?'Modifier le personnel':'Nouveau personnel', fields, async ()=>{
    if (!val('f-nom')||!val('f-prenom')) return toast('Nom et prénom requis','error');
    const dn = val('f-dn'), dr = val('f-dr');
    if (!validateDates([
      checkDate(dn, { label:'Date de naissance',   minYear:1950, maxYear:2006, notFuture:true }),
      checkDate(dr, { label:'Date de recrutement', minYear:2000, maxYear:2099, notFuture:true }),
      dn && dr ? checkOrder(dn, dr, 'Date de naissance', 'Date de recrutement') : null,
    ])) return;
    const body = { nom:val('f-nom'), prenom:val('f-prenom'), email:val('f-email'),
      telephone:val('f-tel'), date_naissance:dn||null, date_recrutement:dr||null,
      statut:val('f-statut'), id_categorie:val('f-cat'), adresse:val('f-adresse'), cin:val('f-cin'),
      sexe:val('f-sexe'), type_contrat:val('f-contrat')
    };
    try {
      if (editingId) { await api(`/personnel/${editingId}`,'PUT',body); toast('Personnel modifié'); }
      else { await api('/personnel','POST',body); toast('Personnel ajouté'); }
      closeModal(); renderPersonnel();
    } catch(e) { toast(e.message,'error'); }
  });
}

// Absences
async function openAbsenceModal(id=null) {
  editingId = id;
  const today = todayISO();
  const pOpts = await getSelectOptions('personnel', 'id_personnel', 'nom');
  let d = {};
  if (id) { const rows = await api('/absences'); d = rows.find(r=>r.id_absence==id)||{}; }
  const fields = [
    { id:'f-pid',    label:'Personnel *', type:'select', value:d.id_personnel||'', options:pOpts, fullWidth:true },
    { id:'f-type',   label:'Type', type:'select', value:d.type_absence||'Maladie',
      options:[{value:'Maladie',label:'Maladie'},{value:'Personnel',label:'Personnel'},
               {value:'Formation',label:'Formation'},{value:'Congé annuel',label:'Congé annuel'},{value:'Autre',label:'Autre'}] },
    { id:'f-statut', label:'Statut', type:'select', value:d.statut||'En attente',
      options:[{value:'En attente',label:'En attente'},{value:'Justifiée',label:'Justifiée'},{value:'Non justifiée',label:'Non justifiée'}] },
    { id:'f-dd', label:'Date début *', type:'date',
      value:toISODate(d.date_debut) || (id ? '' : today), minDate:'2000-01-01', maxDate:'2099-12-31' },
    { id:'f-df', label:'Date fin *',   type:'date',
      value:toISODate(d.date_fin)   || (id ? '' : today), minDate:'2000-01-01', maxDate:'2099-12-31' },
  ];
  await openModalForm(id?'Modifier absence':'Nouvelle absence', fields, async ()=>{
    const dd = val('f-dd'), df = val('f-df');
    if (!dd || !df) return toast('Les deux dates sont requises','error');
    if (!validateDates([
      checkDate(dd, { label:'Date de début', minYear:2000, maxYear:2099 }),
      checkDate(df, { label:'Date de fin',   minYear:2000, maxYear:2099 }),
      checkOrder(dd, df, 'Date de début', 'Date de fin'),
    ])) return;
    const body = { id_personnel:val('f-pid'), type_absence:val('f-type'), statut:val('f-statut'),
      date_debut:dd, date_fin:df };
    try {
      if (editingId) { await api(`/absences/${editingId}`,'PUT',body); toast('Absence modifiée'); }
      else { await api('/absences','POST',body); toast('Absence ajoutée'); }
      closeModal(); renderAbsences();
    } catch(e) { toast(e.message,'error'); }
  });
}

// Heures supplémentaires
async function openHeurModal(id=null) {
  editingId = id;
  const today = todayISO();
  const pOpts = await getSelectOptions('personnel', 'id_personnel', 'nom');
  let d = {};
  if (id) { const rows = await api('/heures'); d = rows.find(r=>r.id_heure_sup==id)||{}; }
  const fields = [
    { id:'f-pid',   label:'Personnel *',        type:'select', value:d.id_personnel||'', options:pOpts, fullWidth:true },
    { id:'f-date',  label:'Date *',              type:'date',
      value:toISODate(d.date) || (id ? '' : today), minDate:'2000-01-01', maxDate:id ? '2099-12-31' : today },
    { id:'f-nb',    label:"Nombre d'heures *",   type:'number', value:d.nombre_heures||'', placeholder:'0.5' },
    { id:'f-motif', label:'Motif',               type:'select', value:d.motif||'Réunion pédagogique',
      options: [
        { value: 'Réunion pédagogique', label: 'Réunion pédagogique' },
        { value: 'Formation', label: 'Formation' },
        { value: "Surveillance d'examen", label: "Surveillance d'examen" },
        { value: 'Correction des examens', label: 'Correction des examens' },
        { value: 'Support informatique', label: 'Support informatique' },
        { value: 'Maintenance informatique', label: 'Maintenance informatique' },
        { value: 'Travail administratif', label: 'Travail administratif' },
        { value: "Intervention d'urgence", label: "Intervention d'urgence" },
        { value: 'Mission spéciale', label: 'Mission spéciale' },
        { value: 'Autre', label: 'Autre' }
      ],
      fullWidth:true
    },
  ];
  await openModalForm(id?'Modifier':'Nouvelle heure supp.', fields, async ()=>{
    if (!val('f-date')||!val('f-nb')) return toast('Date et nombre d\'heures requis','error');
    if (!validateDates([
      checkDate(val('f-date'), { label:'Date', minYear:2000, maxYear:2099, notFuture:true }),
    ])) return;
    const body = { id_personnel:val('f-pid'), date:val('f-date'), nombre_heures:val('f-nb'), motif:val('f-motif') };
    try {
      if (editingId) { await api(`/heures/${editingId}`,'PUT',body); toast('Modifié'); }
      else { await api('/heures','POST',body); toast('Ajouté'); }
      closeModal(); renderHeures();
    } catch(e) { toast(e.message,'error'); }
  });
}

// Rémunérations
async function openRemuModal(id=null) {
  editingId = id;
  const today = todayISO();
  const pOpts = await getSelectOptions('personnel', 'id_personnel', 'nom');
  let d = {};
  if (id) { const rows = await api('/remunerations'); d = rows.find(r=>r.id_remuneration==id)||{}; }
  const fields = [
    { id:'f-pid',   label:'Personnel *',           type:'select', value:d.id_personnel||'', options:pOpts, fullWidth:true },
    { id:'f-base',  label:'Salaire de base (MAD) *', type:'number', value:d.salaire_base||'' },
      { id:'f-prime', label:'Prime (MAD)',             type:'number', value:d.prime||0 },
      { id:'f-prix-hs', label:'Prix Heure Supp. (MAD)', type:'number', value:d.prix_heure_supp||0, readonly:true },
      { id:'f-nb-hs',  label:'Nombre Heures Supp.',    type:'number', value:d.nb_heures_supp||0, readonly:true },
      { id:'f-montant-hs', label:'Montant HS (MAD)',   type:'number', value:d.montant_heures_supp||0, readonly:true },
      { id:'f-ded',   label:'Déduction CNSS (MAD)',    type:'number', value:d.deduction||0 },
      { id:'f-net',   label:'Salaire Net (MAD)',        type:'number', value:d.salaire_net||'', readonly:true },
    { id:'f-dp',    label:'Date de paiement',        type:'date',
      value:toISODate(d.date_paiement) || (id ? '' : today), minDate:'2000-01-01', maxDate:'2099-12-31' },
  ];
  setTimeout(() => {
        const pIdEl = document.getElementById('f-pid');
        const bEl = document.getElementById('f-base');
        const pEl = document.getElementById('f-prime');
        const phsEl = document.getElementById('f-prix-hs');
        const dEl = document.getElementById('f-ded');
        const nhsEl = document.getElementById('f-nb-hs');
        const mhsEl = document.getElementById('f-montant-hs');
        const netEl = document.getElementById('f-net');
        async function updateCalc() {
            if(!pIdEl) return;
            const pid = pIdEl.value;
            let total_hs = 0;
            if(pid) {
                try {
                    const hsRows = await api('/heures');
                    total_hs = hsRows.filter(h => h.id_personnel == pid).reduce((s, h) => s + parseFloat(h.nombre_heures||0), 0);
                } catch(e){}
            }
            if(nhsEl) nhsEl.value = total_hs;
            const base = parseFloat(bEl?.value || 0);
            const prime = parseFloat(pEl?.value || 0);
            const prix_hs = parseFloat(phsEl?.value || 0);
            const ded = parseFloat(dEl?.value || 0);
            const montant_hs = total_hs * prix_hs;
            if(mhsEl) mhsEl.value = montant_hs.toFixed(2);
            const net = base + prime + montant_hs - ded;
            if(netEl) netEl.value = net.toFixed(2);
        }
        if(pIdEl) pIdEl.addEventListener('change', updateCalc);
        [bEl, pEl, phsEl, dEl].forEach(el => el && el.addEventListener('input', updateCalc));
        if(!editingId) updateCalc();
    }, 100);
    await openModalForm(id?'Modifier':'Nouvelle rémunération', fields, async ()=>{
    if (!val('f-base')) return toast('Salaire de base requis','error');
    const dp = val('f-dp');
    if (!validateDates([
      checkDate(dp, { label:'Date de paiement', minYear:2000, maxYear:2099 }),
    ])) return;
    const body = { id_personnel:val('f-pid'), salaire_base:val('f-base'), prime:val('f-prime'),
      prix_heure_supp:val('f-prix-hs'), deduction:val('f-ded'), date_paiement:dp||null };
    try {
      if (editingId) { await api(`/remunerations/${editingId}`,'PUT',body); toast('Modifié'); }
      else { await api('/remunerations','POST',body); toast('Ajouté'); }
      closeModal(); renderRemunerations();
    } catch(e) { toast(e.message,'error'); }
  });
}

// Evaluations
async function openEvalModal(id=null) {
  editingId = id;
  const today = todayISO();
  const pOpts = await getSelectOptions('personnel', 'id_personnel', 'nom');
  let d = {};
  if (id) { const rows = await api('/evaluations'); d = rows.find(r=>r.id_evaluation==id)||{}; }
  const fields = [
    { id:'f-pid',  label:'Personnel *', type:'select', value:d.id_personnel||'', options:pOpts, fullWidth:true },
    { id:'f-date', label:'Date *',      type:'date',
      value:toISODate(d.date_evaluation) || (id ? '' : today), minDate:'2000-01-01', maxDate:id ? '2099-12-31' : today },
    { id:'f-note', label:'Note (/20)',   type:'number', value:d.note||'' },
    { id:'f-com',  label:'Commentaire', type:'textarea', value:d.commentaire||'', fullWidth:true },
  ];
  await openModalForm(id?'Modifier':'Nouvelle évaluation', fields, async ()=>{
    const de = val('f-date');
    if (!de) return toast('La date est requise','error');
    if (!validateDates([
      checkDate(de, { label:"Date d'évaluation", minYear:2000, maxYear:2099, notFuture:true }),
    ])) return;
    const note = val('f-note');
    if (note && (parseFloat(note) < 0 || parseFloat(note) > 20))
      return toast('La note doit être comprise entre 0 et 20', 'error');
    const body = { id_personnel:val('f-pid'), date_evaluation:de, note:note||null, commentaire:val('f-com') };
    try {
      if (editingId) { await api(`/evaluations/${editingId}`,'PUT',body); toast('Modifié'); }
      else { await api('/evaluations','POST',body); toast('Ajouté'); }
      closeModal(); renderEvaluations();
    } catch(e) { toast(e.message,'error'); }
  });
}

// Documents
async function openDocModal(id=null) {
  editingId = id;
  const today = todayISO();
  const pOpts = await getSelectOptions('personnel', 'id_personnel', 'nom');
  let d = {};
  if (id) { const rows = await api('/documents'); d = rows.find(r=>r.id_document==id)||{}; }
  const docTypes = [
    {value:'Livret Individuel',     label:'📄 Livret Individuel'},
    {value:'Planning Prévisionnel', label:'📅 Planning Prévisionnel'},
    {value:'Emploi du Temps',       label:'🕒 Emploi du Temps'},
    {value:'Module de Formation',   label:'📘 Module de Formation'},
    {value:'Données de Diplômes',   label:'🎓 Données de Diplômes'}
  ];
  const fields = [
    { id:'f-pid',    label:'Personnel *',             type:'select', value:d.id_personnel||'', options:pOpts, fullWidth:true },
    { id:'f-type',   label:'Type de document *',       type:'select', value:d.type_document||'Livret Individuel', options:docTypes, fullWidth:true },
    { id:'f-date',   label:'Date de dépôt *',          type:'date',
      value:toISODate(d.date_depot) || (id ? '' : today), minDate:'2000-01-01', maxDate:id ? '2099-12-31' : today }
  ];
  await openModalForm(id?'Modifier le document':'Nouveau document', fields, async ()=>{
    const dd = val('f-date');
    if (!val('f-pid')||!val('f-type')||!dd) return toast('Personnel, Type et Date requis','error');
    if (!validateDates([
      checkDate(dd, { label:'Date de dépôt', minYear:2000, maxYear:2099, notFuture:true }),
    ])) return;
    const body = { id_personnel:val('f-pid'), type_document:val('f-type'), date_depot:dd };
    try {
      if (editingId) { await api(`/documents/${editingId}`,'PUT',body); toast('Document modifié'); }
      else { await api('/documents','POST',body); toast('Document ajouté'); }
      closeModal(); renderDocuments();
    } catch(e) { toast(e.message,'error'); }
  });
}

// Categories
async function openCatModal(id=null, libelle='') {
  editingId = id;
  const fields = [
    { id:'f-lib', label:'Libellé *', value:libelle, fullWidth:true }
  ];
  await openModalForm(id?'Modifier la catégorie':'Nouvelle catégorie', fields, async ()=>{
    if (!val('f-lib')) return toast('Libellé requis','error');
    const body = { libelle_categorie:val('f-lib') };
    try {
      if (editingId) { await api(`/categories/${editingId}`,'PUT',body); toast('Catégorie modifiée'); }
      else { await api('/categories','POST',body); toast('Catégorie ajoutée'); }
      closeModal(); renderCategories();
    } catch(e) { toast(e.message,'error'); }
  });
}

// Helpers
async function getSelectOptions(endpoint, valKey, labelKey) {
  try {
    const rows = await api(`/${endpoint}`);
    return rows.map(r => ({ value: r[valKey], label: r[labelKey] }));
  } catch(e) { return []; }
}

async function deleteRecord(path, msg, renderFn) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
  try {
    await api(path, 'DELETE');
    toast(msg);
    renderFn();
  } catch(e) { toast(e.message, 'error'); }
}

function printDocument(type) {
  const map = {
    'Livret Individuel':      '/livret',
    'Planning Prévisionnel':  '/planning',
    'Emploi du Temps':        '/emploi',
    'Module de Formation':    '/module',
    'Données de Diplômes':    '/diplome'
  };
  const url = map[type];
  if (url) {
    window.open(url, '_blank');
  } else {
    toast("Modèle d'impression non trouvé", "error");
  }
}

async function viewPersonnel(id) {
  try {
    const p = await api(`/personnel/${id}`);
    
    // Hide standard footer
    document.getElementById('modal-foot').style.display = 'none';
    
    const bodyHTML = `
      <div class="fiche-container">
        <div class="fiche-header">
          <div class="fiche-avatar ${avatarColor(p.nom)}">${initials(p.nom, p.prenom)}</div>
          <div class="fiche-title-area">
            <h2>${p.nom} ${p.prenom}</h2>
            <p><span class="badge b-purple">${p.libelle_categorie || 'Non classifié'}</span> • ${p.email || 'Pas d\'email'}</p>
          </div>
          <img src="/assets/logo-ipirnet.png" class="fiche-header-logo" alt="Logo">
        </div>
        <div class="fiche-sections">
          <div class="fiche-section">
            <div class="fiche-section-title">👤 Informations Personnelles</div>
            <div class="fiche-item">
              <span class="fiche-item-label">🪪 CIN</span>
              <span class="fiche-item-val">${p.cin || '-'}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">⚥ Sexe</span>
              <span class="fiche-item-val">${p.sexe || '-'}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">🎂 Date de naissance</span>
              <span class="fiche-item-val">${fmtDate(p.date_naissance)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">📞 Téléphone</span>
              <span class="fiche-item-val">${p.telephone || '-'}</span>
            </div>
            <div class="fiche-item" style="border-bottom:none;">
              <span class="fiche-item-label">📍 Adresse</span>
              <span class="fiche-item-val" style="max-width: 170px; text-align: right; word-break: break-all;">${p.adresse || '-'}</span>
            </div>
          </div>
          <div class="fiche-section">
            <div class="fiche-section-title">💼 Contrat & Rémunération</div>
            <div class="fiche-item">
              <span class="fiche-item-label">📜 Type contrat</span>
              <span class="fiche-item-val">${p.type_contrat || '-'}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">🏷️ Statut</span>
              <span class="fiche-item-val">${statusBadge(p.statut)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">📅 Recrutement</span>
              <span class="fiche-item-val">${fmtDate(p.date_recrutement)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">💰 Salaire net</span>
              <span class="fiche-item-val">${p.salaire_net || 0} MAD</span>
            </div>
            <div class="fiche-item">
              
            </div>
            <div class="fiche-item" style="border-bottom:none;">
              <span class="fiche-item-label">⏱️ Heures supp.</span>
              <span class="fiche-item-val">${p.heures_supp || 0} h</span>
            </div>
          </div>
        </div>
        <div class="fiche-actions">
          <button class="btn btn-primary" onclick="printFiche(${p.id_personnel})">🖨️ Imprimer la fiche</button>
          <button class="btn" onclick="closeModal()">Fermer</button>
        </div>
      </div>
    `;
    
    openModal("Fiche Personnel", bodyHTML, null);
  } catch(e) {
    toast(e.message, 'error');
  }
}

async function viewAbsence(id) {
  try {
    const rows = await api('/absences');
    const a = rows.find(r => r.id_absence == id);
    if (!a) throw new Error('Absence introuvable');

    document.getElementById('modal-foot').style.display = 'none';

    let diffDays = '-';
    if (a.date_debut && a.date_fin) {
      const d1 = new Date(a.date_debut);
      const d2 = new Date(a.date_fin);
      diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    }

    const bodyHTML = `
      <div class="fiche-container">
        <div class="fiche-header">
          <div class="fiche-avatar av-c">📅</div>
          <div class="fiche-title-area">
            <h2>Attestation d'Absence / Congé</h2>
            <p>${a.nom_complet} • Statut: ${a.statut}</p>
          </div>
          <img src="/assets/logo-ipirnet.png" class="fiche-header-logo" alt="Logo">
        </div>
        <div class="fiche-sections">
          <div class="fiche-section" style="grid-column: 1/-1;">
            <div class="fiche-section-title">📅 Détails du congé</div>
            <div class="fiche-item">
              <span class="fiche-item-label">👤 Personnel</span>
              <span class="fiche-item-val">${a.nom_complet}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">🏷️ Type d'absence</span>
              <span class="fiche-item-val">${a.type_absence || '-'}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">🏁 Date début</span>
              <span class="fiche-item-val">${fmtDate(a.date_debut)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">🏁 Date fin</span>
              <span class="fiche-item-val">${fmtDate(a.date_fin)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">⏱️ Nombre de jours</span>
              <span class="fiche-item-val">${diffDays} jour(s)</span>
            </div>
            <div class="fiche-item" style="border-bottom:none;">
              <span class="fiche-item-label">📋 Statut</span>
              <span class="fiche-item-val">${absBadge(a.statut)}</span>
            </div>
          </div>
        </div>
        <div class="fiche-actions">
          <button class="btn btn-primary" onclick="window.open('/fiche-absence?id=${id}', '_blank')">🖨️ Imprimer l'attestation</button>
          <button class="btn" onclick="closeModal()">Fermer</button>
        </div>
      </div>
    `;
    openModal("Détail Absence", bodyHTML, null);
  } catch(e) {
    toast(e.message, 'error');
  }
}

async function viewHeure(id) {
  try {
    const rows = await api('/heures');
    const h = rows.find(r => r.id_heure_sup == id);
    if (!h) throw new Error('Enregistrement introuvable');

    document.getElementById('modal-foot').style.display = 'none';

    const heures = parseFloat(h.nombre_heures || 0);
    const contrat = h.type_contrat || '-';
    const taux = contrat === 'CDI' ? 25 : contrat === 'CDD' ? 20 : 0;
    const montant = heures * taux;

    const bodyHTML = `
      <div class="fiche-container">
        <div class="fiche-header">
          <div class="fiche-avatar av-d">⏱️</div>
          <div class="fiche-title-area">
            <h2>Heures Supplémentaires</h2>
            <p>${h.nom_complet} • ${heures} heures</p>
          </div>
          <img src="/assets/logo-ipirnet.png" class="fiche-header-logo" alt="Logo">
        </div>
        <div class="fiche-sections">
          <div class="fiche-section" style="grid-column: 1/-1;">
            <div class="fiche-section-title">⏱️ Déclaration d'activité</div>
            <div class="fiche-item">
              <span class="fiche-item-label">👤 Personnel</span>
              <span class="fiche-item-val">${h.nom_complet}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">📄 Contrat</span>
              <span class="fiche-item-val"><span class="badge b-info">${contrat}</span></span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">📅 Date</span>
              <span class="fiche-item-val">${fmtDate(h.date)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">⏱️ Heures déclarées</span>
              <span class="fiche-item-val">${heures} h</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">🪙 Prix heure</span>
              <span class="fiche-item-val">${taux.toFixed(2)} MAD / h</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">💰 Montant calculé</span>
              <span class="fiche-item-val">${montant.toFixed(2)} MAD</span>
            </div>
            <div class="fiche-item" style="border-bottom:none;">
              <span class="fiche-item-label">💬 Motif</span>
              <span class="fiche-item-val">${h.motif || '-'}</span>
            </div>
          </div>
        </div>
        <div class="fiche-actions">
          <button class="btn btn-primary" onclick="window.open('/fiche-heure?id=${id}', '_blank')">🖨️ Imprimer la fiche</button>
          <button class="btn" onclick="closeModal()">Fermer</button>
        </div>
      </div>
    `;
    openModal("Détail Heure Supplémentaire", bodyHTML, null);
  } catch(e) {
    toast(e.message, 'error');
  }
}

async function viewRemuneration(id) {
  try {
    const rows = await api('/remunerations');
    const r = rows.find(x => x.id_remuneration == id);
    if (!r) throw new Error('Bulletin introuvable');

    document.getElementById('modal-foot').style.display = 'none';

    const bodyHTML = `
      <div class="fiche-container">
        <div class="fiche-header">
          <div class="fiche-avatar av-a">💰</div>
          <div class="fiche-title-area">
            <h2>Bulletin de Paie Simplifié</h2>
            <p>${r.nom_complet} • Net: ${fmtMoney(r.salaire_net)}</p>
          </div>
          <img src="/assets/logo-ipirnet.png" class="fiche-header-logo" alt="Logo">
        </div>
        <div class="fiche-sections">
          <div class="fiche-section" style="grid-column: 1/-1;">
            <div class="fiche-section-title">🪙 Détails financiers</div>
            <div class="fiche-item">
              <span class="fiche-item-label">👤 Personnel</span>
              <span class="fiche-item-val">${r.nom_complet}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">💰 Salaire de base</span>
              <span class="fiche-item-val">${fmtMoney(r.salaire_base)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">🎁 Prime</span>
              <span class="fiche-item-val" style="color:var(--success);">${fmtMoney(r.prime)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">💸 Déduction</span>
              <span class="fiche-item-val" style="color:var(--danger);">${fmtMoney(r.deduction)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">🪙 Salaire Net</span>
              <span class="fiche-item-val" style="font-weight:bold; color:var(--accent);">${fmtMoney(r.salaire_net)}</span>
            </div>
            <div class="fiche-item" style="border-bottom:none;">
              <span class="fiche-item-label">📅 Date de paiement</span>
              <span class="fiche-item-val">${fmtDate(r.date_paiement)}</span>
            </div>
          </div>
        </div>
        <div class="fiche-actions">
          <button class="btn btn-primary" onclick="window.open('/fiche-remuneration?id=${id}', '_blank')">🖨️ Imprimer le bulletin</button>
          <button class="btn" onclick="closeModal()">Fermer</button>
        </div>
      </div>
    `;
    openModal("Détail Rémunération", bodyHTML, null);
  } catch(e) {
    toast(e.message, 'error');
  }
}

async function viewEvaluation(id) {
  try {
    const rows = await api('/evaluations');
    const e = rows.find(x => x.id_evaluation == id);
    if (!e) throw new Error('Évaluation introuvable');

    document.getElementById('modal-foot').style.display = 'none';

    const note = parseFloat(e.note || 0);
    const resText = note >= 10 ? 'Favorable (Admis)' : 'À améliorer (Ajourné)';
    const resColor = note >= 10 ? 'var(--success)' : 'var(--danger)';

    const bodyHTML = `
      <div class="fiche-container">
        <div class="fiche-header">
          <div class="fiche-avatar av-b">📋</div>
          <div class="fiche-title-area">
            <h2>Fiche d'Évaluation</h2>
            <p>${e.nom_complet} • Note: ${note.toFixed(2)} / 20.00</p>
          </div>
          <img src="/assets/logo-ipirnet.png" class="fiche-header-logo" alt="Logo">
        </div>
        <div class="fiche-sections">
          <div class="fiche-section" style="grid-column: 1/-1;">
            <div class="fiche-section-title">📋 Rendement & appréciations</div>
            <div class="fiche-item">
              <span class="fiche-item-label">👤 Personnel</span>
              <span class="fiche-item-val">${e.nom_complet}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">📅 Date d'évaluation</span>
              <span class="fiche-item-val">${fmtDate(e.date_evaluation)}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">⭐ Note obtenue</span>
              <span class="fiche-item-val" style="font-weight:bold;">${note.toFixed(2)} / 20.00</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-item-label">🎯 Résultat</span>
              <span class="fiche-item-val" style="font-weight:bold; color:${resColor};">${resText}</span>
            </div>
            <div class="fiche-item" style="border-bottom:none;">
              <span class="fiche-item-label">💬 Commentaire</span>
              <span class="fiche-item-val" style="max-width: 250px; text-align: right; word-break: break-word;">${e.commentaire || '-'}</span>
            </div>
          </div>
        </div>
        <div class="fiche-actions">
          <button class="btn btn-primary" onclick="window.open('/fiche-evaluation?id=${id}', '_blank')">🖨️ Imprimer la fiche</button>
          <button class="btn" onclick="closeModal()">Fermer</button>
        </div>
      </div>
    `;
    openModal("Détail Évaluation", bodyHTML, null);
  } catch(err) {
    toast(err.message, 'error');
  }
}

function printFiche(id) {
  window.open(`/fiche-personnel?id=${id}`, '_blank');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Init
loadPage(currentPage);
