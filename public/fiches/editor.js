/**
 * editor.js – WYSIWYG + Autosave system for IPIRNET manual documents
 *
 * Strategy:
 *  1. On keystroke/change → save immediately to localStorage (instant, no network)
 *  2. On keystroke/change → debounce 4s → save to DB via POST /save-editor
 *  3. On load → load from DB first; if DB empty → load from localStorage draft
 *  4. On beforeunload → flush pending save immediately
 *  5. Manual "Enregistrer" button forces immediate DB save
 */

(function () {
  'use strict';

  const urlParams = new URLSearchParams(window.location.search);
  const DOC_ID    = urlParams.get('id');
  const LS_KEY    = DOC_ID ? 'editor_draft_' + DOC_ID : null;
  const AUTOSAVE_DELAY_MS = 5000; // 5s debounce before DB save

  let autosaveTimer  = null;
  let isDirty        = false;   // true if unsaved changes exist
  let isSavingToDB   = false;   // prevent concurrent DB saves
  let lastSavedHash  = '';      // detect real changes vs. spurious events
  let pageContainer  = null;

  // ── Inject Toolbar ─────────────────────────────────────────────────────────
  function injectToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'wysiwyg-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button id="btn-bold"      title="Gras (Ctrl+B)"      onclick="document.execCommand('bold')"><b>B</b></button>
        <button id="btn-italic"    title="Italique (Ctrl+I)"  onclick="document.execCommand('italic')"><i>I</i></button>
        <button id="btn-underline" title="Souligné (Ctrl+U)"  onclick="document.execCommand('underline')"><u>U</u></button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <select id="sel-heading" title="Style de titre" onchange="if(this.value){document.execCommand('formatBlock',false,this.value);this.value='';}">
          <option value="">Titre…</option>
          <option value="H1">Titre 1</option>
          <option value="H2">Titre 2</option>
          <option value="H3">Titre 3</option>
          <option value="P">Paragraphe</option>
        </select>
        <select id="sel-fontsize" title="Taille du texte" onchange="if(this.value){document.execCommand('fontSize',false,this.value);this.value='';}">
          <option value="">Taille…</option>
          <option value="2">Petit</option>
          <option value="3">Normal</option>
          <option value="4">Grand</option>
          <option value="5">Très grand</option>
        </select>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button title="Aligner à gauche"  onclick="document.execCommand('justifyLeft')">⬅</button>
        <button title="Centrer"            onclick="document.execCommand('justifyCenter')">≡</button>
        <button title="Aligner à droite"  onclick="document.execCommand('justifyRight')">➡</button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button title="Liste à puces"   onclick="document.execCommand('insertUnorderedList')">• Liste</button>
        <button title="Liste numérotée" onclick="document.execCommand('insertOrderedList')">1. Liste</button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button id="btn-add-row" title="Ajouter ligne tableau"   onclick="editorAddTableRow()">+ Ligne</button>
        <button id="btn-del-row" title="Supprimer ligne tableau" onclick="editorRemoveTableRow()">- Ligne</button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group toolbar-actions">
        <span id="autosave-indicator" class="autosave-indicator" title="Statut sauvegarde automatique"></span>
        <span id="editor-status" class="editor-status"></span>
        <button id="btn-save"  class="btn-save"  onclick="editorManualSave()">💾 Enregistrer</button>
        <button id="btn-print" class="btn-print" onclick="window.print()">🖨️ Imprimer</button>
      </div>
    `;
    document.body.insertBefore(toolbar, document.body.firstChild);
  }

  // ── Page container ─────────────────────────────────────────────────────────
  function getPageContainer() {
    return document.querySelector('.page') ||
           document.querySelector('body > div:not(#wysiwyg-toolbar)') ||
           document.body;
  }

  // ── Hash helper (detect real content changes) ──────────────────────────────
  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return h;
  }

  // ── Status helpers ─────────────────────────────────────────────────────────
  function setStatus(msg, type) {
    const el = document.getElementById('editor-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'editor-status status-' + (type || 'info');
    clearTimeout(el._t);
    if (type === 'success' || type === 'info') {
      el._t = setTimeout(() => { el.textContent = ''; }, 3000);
    }
  }

  function setAutosaveIndicator(state) {
    // state: 'saved' | 'pending' | 'saving' | 'error' | 'draft'
    const el = document.getElementById('autosave-indicator');
    if (!el) return;
    const map = {
      saved:   { text: '✅ Sauvegardé',          css: 'as-saved'   },
      pending: { text: '✏️ Modifications…',       css: 'as-pending' },
      saving:  { text: '⏳ Sauvegarde…',          css: 'as-saving'  },
      error:   { text: '❌ Erreur sauvegarde',    css: 'as-error'   },
      draft:   { text: '📋 Brouillon local',      css: 'as-draft'   },
      loading: { text: '📥 Chargement…',          css: 'as-saving'  },
    };
    const s = map[state] || { text: '', css: '' };
    el.textContent = s.text;
    el.className   = 'autosave-indicator ' + s.css;
  }

  // ── localStorage draft ─────────────────────────────────────────────────────
  function saveDraft(html) {
    if (!LS_KEY) return;
    try {
      localStorage.setItem(LS_KEY, html);
      localStorage.setItem(LS_KEY + '_ts', Date.now());
    } catch(e) { /* quota exceeded — ignore */ }
  }

  function loadDraft() {
    if (!LS_KEY) return null;
    try { return localStorage.getItem(LS_KEY) || null; } catch(e) { return null; }
  }

  function clearDraft() {
    if (!LS_KEY) return;
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_KEY + '_ts');
    } catch(e) {}
  }

  function getDraftAge() {
    if (!LS_KEY) return null;
    try {
      const ts = parseInt(localStorage.getItem(LS_KEY + '_ts') || '0');
      return ts ? Math.round((Date.now() - ts) / 1000) : null;
    } catch(e) { return null; }
  }

  // ── DB save ────────────────────────────────────────────────────────────────
  function saveToDb(html) {
    return new Promise((resolve, reject) => {
      if (!DOC_ID) return resolve();
      if (isSavingToDB) return resolve(); // skip if already saving

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      isSavingToDB = true;
      setAutosaveIndicator('saving');

      fetch('/api/documents/save-editor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({ id_document: DOC_ID, contenu_html: html })
      })
      .then(r => r.json())
      .then(res => {
        isSavingToDB = false;
        if (res.success) {
          isDirty = false;
          clearDraft();          // DB saved → local draft no longer needed
          lastSavedHash = simpleHash(html);
          setAutosaveIndicator('saved');
          resolve();
        } else {
          setAutosaveIndicator('error');
          setStatus('Erreur: ' + (res.error || 'Inconnue'), 'error');
          reject(new Error(res.error));
        }
      })
      .catch(err => {
        isSavingToDB = false;
        setAutosaveIndicator('error');
        setStatus('Hors ligne – brouillon conservé localement', 'warning');
        reject(err);
      });
    });
  }

  // ── Autosave trigger (called on every content change) ─────────────────────
  function onContentChanged() {
    if (!pageContainer) return;
    const html = pageContainer.innerHTML;
    const hash = simpleHash(html);
    if (hash === lastSavedHash) return; // no real change

    isDirty = true;
    setAutosaveIndicator('pending');

    // 1. Instant local save
    saveDraft(html);

    // 2. Debounced DB save
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveToDb(pageContainer.innerHTML).catch(() => {});
    }, AUTOSAVE_DELAY_MS);
  }

  // ── Attach change listeners ────────────────────────────────────────────────
  function attachListeners(container) {
    container.addEventListener('input',  onContentChanged);
    container.addEventListener('keyup',  onContentChanged);
    container.addEventListener('paste',  () => setTimeout(onContentChanged, 50));
    container.addEventListener('cut',    () => setTimeout(onContentChanged, 50));

    // MutationObserver catches table row additions/deletions
    const obs = new MutationObserver(() => setTimeout(onContentChanged, 100));
    obs.observe(container, { childList: true, subtree: true, characterData: true });
  }

  // ── Load content on page open ──────────────────────────────────────────────
  async function loadContent() {
    if (!DOC_ID) {
      setStatus('Aperçu – aucun ID dans l\'URL', 'warning');
      return;
    }

    setAutosaveIndicator('loading');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    try {
      const res  = await fetch('/api/documents/' + DOC_ID, {
        headers: { 'Authorization': 'Bearer ' + (token || '') }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const doc = await res.json();

      if (doc && doc.contenu_html && doc.contenu_html.trim() !== '') {
        // DB has a saved version → use it
        pageContainer.innerHTML = doc.contenu_html;
        pageContainer.contentEditable = 'true';
        lastSavedHash = simpleHash(doc.contenu_html);
        clearDraft(); // DB version is authoritative
        setAutosaveIndicator('saved');
        setStatus('Version sauvegardée chargée', 'success');
      } else {
        // DB is empty → check local draft
        const draft = loadDraft();
        if (draft) {
          const age = getDraftAge();
          const ageStr = age !== null ? (age < 60 ? age + 's' : Math.round(age/60) + 'min') : '';
          pageContainer.innerHTML = draft;
          pageContainer.contentEditable = 'true';
          lastSavedHash = 0; // force dirty so it syncs to DB
          isDirty = true;
          setAutosaveIndicator('draft');
          setStatus('Brouillon local restauré (' + ageStr + ' ago) – sauvegardez pour confirmer', 'warning');
        } else {
          // Nothing saved → use the template as-is
          pageContainer.contentEditable = 'true';
          lastSavedHash = simpleHash(pageContainer.innerHTML);
          setAutosaveIndicator('saved');
          setStatus('Prêt à éditer', 'info');
        }
      }
    } catch(e) {
      console.error('[editor.js] Load error:', e);
      // Network error → try local draft
      const draft = loadDraft();
      if (draft) {
        pageContainer.innerHTML = draft;
        pageContainer.contentEditable = 'true';
        setAutosaveIndicator('draft');
        setStatus('Mode hors ligne – brouillon local chargé', 'warning');
      } else {
        pageContainer.contentEditable = 'true';
        setStatus('Erreur de chargement: ' + e.message, 'error');
      }
    }

    // Attach change listeners AFTER content is loaded
    attachListeners(pageContainer);
  }

  // ── beforeunload: flush pending save ──────────────────────────────────────
  window.addEventListener('beforeunload', (e) => {
    if (!isDirty || !pageContainer) return;
    // Ensure local draft is up to date
    saveDraft(pageContainer.innerHTML);
    // Try a synchronous-style beacon save (best effort)
    if (DOC_ID) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const payload = JSON.stringify({
        id_document: DOC_ID,
        contenu_html: pageContainer.innerHTML
      });
      navigator.sendBeacon(
        '/api/documents/save-editor',
        new Blob([payload], { type: 'application/json' })
      );
    }
    // Show browser warning only if still dirty
    e.preventDefault();
    e.returnValue = 'Des modifications non sauvegardées seront perdues. Continuer ?';
  });

  // ── Keyboard shortcut Ctrl+S ───────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      editorManualSave();
    }
  });

  // ── Init ───────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async function () {
    injectToolbar();
    pageContainer = getPageContainer();
    if (pageContainer && pageContainer.id === 'wysiwyg-toolbar') {
      pageContainer = document.querySelectorAll('body > *:not(#wysiwyg-toolbar)')[0];
    }
    if (!pageContainer) return;
    pageContainer.setAttribute('data-editor-zone', 'true');
    await loadContent();
  });

  // ── Public API (called from buttons) ──────────────────────────────────────
  window.editorManualSave = async function () {
    if (!pageContainer) return;
    const btn = document.getElementById('btn-save');
    if (btn) btn.disabled = true;
    clearTimeout(autosaveTimer);
    const html = pageContainer.innerHTML;
    saveDraft(html); // local first
    try {
      await saveToDb(html);
      setStatus('✅ Document enregistré !', 'success');
    } catch(e) {
      setStatus('Erreur: ' + e.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  window.editorAddTableRow = function () {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { setStatus('Placez le curseur dans un tableau', 'warning'); return; }
    let node = sel.focusNode;
    while (node && node.nodeName !== 'TR' && node.nodeName !== 'BODY') node = node.parentNode;
    if (node && node.nodeName === 'TR') {
      const newTr = node.cloneNode(true);
      newTr.querySelectorAll('td').forEach(td => { td.innerHTML = '&nbsp;'; });
      node.parentNode.insertBefore(newTr, node.nextSibling);
      setStatus('Ligne ajoutée', 'success');
    } else {
      setStatus('Placez le curseur dans une ligne de tableau', 'warning');
    }
  };

  window.editorRemoveTableRow = function () {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { setStatus('Placez le curseur dans une ligne', 'warning'); return; }
    let node = sel.focusNode;
    while (node && node.nodeName !== 'TR' && node.nodeName !== 'BODY') node = node.parentNode;
    if (node && node.nodeName === 'TR') {
      const parent = node.parentNode;
      if (parent && parent.rows && parent.rows.length <= 1) {
        setStatus('Impossible de supprimer la dernière ligne', 'warning'); return;
      }
      parent.removeChild(node);
      setStatus('Ligne supprimée', 'success');
    } else {
      setStatus('Placez le curseur dans la ligne à supprimer', 'warning');
    }
  };

  window.setStatus = function(msg, type) {
    const el = document.getElementById('editor-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'editor-status status-' + (type || 'info');
    clearTimeout(el._t);
    if (type === 'success' || type === 'info') {
      el._t = setTimeout(() => { el.textContent = ''; }, 3000);
    }
  };

})();
