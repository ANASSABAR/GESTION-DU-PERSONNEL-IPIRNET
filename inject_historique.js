/**
 * inject_historique.js
 * Replaces the old renderHistorique function (lines 1017-1045)
 * with the new full-featured version directly in index.html
 */
const fs = require('fs');
const file = 'public/index.html';
let html = fs.readFileSync(file, 'utf8');

const OLD_BLOCK = `// Historique
async function renderHistorique() {
  showLoader();
  try {
    const rows = await api('/historique');
    const trs = rows.map(h => {
      let bClass = h.statut_document === 'Imprimé' ? 'b-success' : h.statut_document === 'Archivé' ? 'b-warning' : 'b-info';
      return \`
      <tr>
        <td><strong>\${h.type_document}</strong></td>
        <td>\${h.nom_document}</td>
        <td><span class="badge b-purple">\${h.module_source}</span></td>
        <td>\${h.personnel_nom ? h.personnel_nom + ' ' + h.personnel_prenom : '—'}</td>
        <td>\${fmtDate(h.date_generation)}</td>
        <td><span class="badge \${bClass}">\${h.statut_document}</span></td>
        <td>
          <button class="btn btn-sm btn-icon" onclick="window.open('\${h.chemin_fichier}', '_blank')" title="Voir / Télécharger">👁️</button>
          \${currentUser.role === 'Administration' ? \`<button class="btn btn-sm btn-icon" onclick="deleteRecord('/historique/\${h.id_historique}','Historique supprimé',renderHistorique)" title="Supprimer">🗑️</button>\` : ''}
        </td>
      </tr>\`;
    }).join('');
    setContent(\`
      <div class="section-hdr"><span class="badge b-info">\${rows.length} historique(s)</span></div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Type document</th><th>Nom fichier</th><th>Module source</th><th>Personnel concerné</th><th>Date génération</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>\${trs||'<tr><td colspan="7"><div class="empty-state"><div class="icon">⏱</div><p>Aucun historique</p></div></td></tr>'}</tbody>
      </table></div></div>\`);
  } catch(e) { setContent(\`<p style="color:var(--danger)">\${e.message}</p>\`); }
}`;

if (!html.includes('async function renderHistorique()')) {
  console.error('Could not find renderHistorique in index.html'); process.exit(1);
}

const NEW_BLOCK = `// ── Historique ──────────────────────────────────────────────────────────────

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  const p = n => String(n).padStart(2,'0');
  return \`\${p(dt.getDate())}/\${p(dt.getMonth()+1)}/\${dt.getFullYear()} \${p(dt.getHours())}:\${p(dt.getMinutes())}:\${p(dt.getSeconds())}\`;
}

async function renderHistorique() {
  showLoader();
  try {
    const rows = await api('/historique');
    const isAdmin = currentUser.role === 'Administration';

    const adminBar = isAdmin ? \`
      <button class="btn btn-sm" onclick="histSelectAll()" title="Tout sélectionner">☑ Tout sélectionner</button>
      <button class="btn btn-sm" onclick="histSelectNone()" title="Tout désélectionner">☐ Tout désélectionner</button>
      <button class="btn btn-sm btn-danger" id="hist-del-sel" onclick="histDeleteSelected()" disabled
        title="Supprimer la sélection">🗑 Supprimer la sélection (<span id="hist-sel-count">0</span>)</button>
    \` : '';

    const checkHead = isAdmin
      ? '<th style="width:36px"><input type="checkbox" id="hist-cb-all" onchange="histToggleAll(this.checked)" title="Tout cocher"></th>'
      : '';

    const emptySpan = isAdmin ? '8' : '7';

    const trs = rows.map(h => {
      const bClass = h.statut_document === 'Imprimé' ? 'b-success' : h.statut_document === 'Archivé' ? 'b-warning' : 'b-info';
      const checkCell = isAdmin
        ? \`<td><input type="checkbox" class="hist-cb" data-id="\${h.id_historique}" onchange="histUpdateSelCount()"></td>\`
        : '';
      return \`<tr id="hist-row-\${h.id_historique}">
        \${checkCell}
        <td><strong>\${h.type_document}</strong></td>
        <td>\${h.nom_document}</td>
        <td><span class="badge b-purple">\${h.module_source}</span></td>
        <td>\${h.personnel_nom ? h.personnel_nom + ' ' + h.personnel_prenom : '—'}</td>
        <td style="white-space:nowrap">\${fmtDateTime(h.date_generation)}</td>
        <td><span class="badge \${bClass}">\${h.statut_document}</span></td>
        <td>
          <button class="btn btn-sm btn-icon" onclick="window.open('\${h.chemin_fichier}','_blank')" title="Voir">👁️</button>
          \${isAdmin ? \`<button class="btn btn-sm btn-icon" onclick="deleteRecord('/historique/\${h.id_historique}','Historique supprimé',renderHistorique)" title="Supprimer">🗑️</button>\` : ''}
        </td>
      </tr>\`;
    }).join('');

    setContent(\`
      <div class="section-hdr" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="badge b-info">\${rows.length} historique(s)</span>
        <button class="btn btn-sm" onclick="histPrintAll()" title="Imprimer tout l'historique">🖨️ Imprimer tout</button>
        \${adminBar}
      </div>
      <div class="card"><div class="table-wrap"><table id="hist-table">
        <thead><tr>
          \${checkHead}
          <th>Type document</th><th>Nom fichier</th><th>Module source</th>
          <th>Personnel concerné</th><th>Date &amp; Heure génération</th><th>Statut</th><th>Actions</th>
        </tr></thead>
        <tbody>\${trs || \`<tr><td colspan="\${emptySpan}"><div class="empty-state"><div class="icon">⏱</div><p>Aucun historique</p></div></td></tr>\`}</tbody>
      </table></div></div>\`);
  } catch(e) { setContent(\`<p style="color:var(--danger)">\${e.message}</p>\`); }
}

// ── Historique helpers ────────────────────────────────────────────────────────

function histGetSelectedIds() {
  return Array.from(document.querySelectorAll('.hist-cb:checked')).map(cb => parseInt(cb.dataset.id));
}

function histUpdateSelCount() {
  const ids   = histGetSelectedIds();
  const btn   = document.getElementById('hist-del-sel');
  const span  = document.getElementById('hist-sel-count');
  const cbAll = document.getElementById('hist-cb-all');
  const total = document.querySelectorAll('.hist-cb').length;
  if (span)  span.textContent = ids.length;
  if (btn)   btn.disabled = ids.length === 0;
  if (cbAll) {
    cbAll.checked       = ids.length > 0 && ids.length === total;
    cbAll.indeterminate = ids.length > 0 && ids.length < total;
  }
}

function histToggleAll(checked) {
  document.querySelectorAll('.hist-cb').forEach(cb => { cb.checked = checked; });
  histUpdateSelCount();
}

function histSelectAll()  { histToggleAll(true);  }
function histSelectNone() { histToggleAll(false); }

async function histDeleteSelected() {
  const ids = histGetSelectedIds();
  if (!ids.length) return;
  const label = ids.length === 1 ? 'cet enregistrement' : \`ces \${ids.length} enregistrements\`;
  showConfirmModal(
    \`Supprimer \${label} de l'historique ?\`,
    'Cette action est irréversible.',
    async () => {
      try {
        await api('/historique/bulk', 'DELETE', { ids });
        toast(\`\${ids.length} entrée(s) supprimée(s)\`, 'success');
        renderHistorique();
      } catch(e) { toast(e.message, 'error'); }
    }
  );
}

function histPrintAll() {
  const now = new Date();
  const p   = n => String(n).padStart(2,'0');
  const dateStr = \`\${p(now.getDate())}/\${p(now.getMonth()+1)}/\${now.getFullYear()}\`;
  const timeStr = \`\${p(now.getHours())}:\${p(now.getMinutes())}:\${p(now.getSeconds())}\`;

  const rows = document.querySelectorAll('#hist-table tbody tr');
  const hasCheck = !!document.getElementById('hist-cb-all');
  let trs = '';
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    if (!cells.length) return;
    const start = hasCheck ? 1 : 0;
    const data  = cells.slice(start, cells.length - 1);
    trs += '<tr>' + data.map(c => \`<td>\${c.innerHTML}</td>\`).join('') + '</tr>';
  });

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(\`<!DOCTYPE html><html lang="fr"><head>
    <meta charset="UTF-8">
    <title>Historique Documents – IPIRNET</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;margin:30px;color:#1e293b}
      h1{font-size:20px;margin-bottom:4px;color:#1e3a5f}
      .meta{font-size:13px;color:#64748b;margin-bottom:18px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#1e3a5f;color:white;padding:8px 10px;text-align:left}
      td{padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
      tr:nth-child(even) td{background:#f8fafc}
      .badge{padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
      @media print{@page{margin:15mm}}
    </style></head><body>
    <h1>📋 Historique des Documents – IPIRNET Gestion du Personnel</h1>
    <p class="meta">Généré le <strong>\${dateStr}</strong> à <strong>\${timeStr}</strong></p>
    <table><thead><tr>
      <th>Type document</th><th>Nom fichier</th><th>Module source</th>
      <th>Personnel</th><th>Date &amp; Heure génération</th><th>Statut</th>
    </tr></thead><tbody>
      \${trs || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Aucun historique</td></tr>'}
    </tbody></table></body></html>\`);
  win.document.close();
  win.onload = () => setTimeout(() => win.print(), 400);
}`;

// Replace the old block
html = html.replace(
  /\/\/ Historique\nasync function renderHistorique[\s\S]*?\n\}\n\n\/\/ Catégories/,
  NEW_BLOCK + '\n\n// Catégories'
);

if (!html.includes('fmtDateTime')) {
  console.error('Injection failed — fmtDateTime not found after replacement!');
  process.exit(1);
}

fs.writeFileSync(file, html);
console.log('✅ renderHistorique successfully replaced with full-featured version.');
