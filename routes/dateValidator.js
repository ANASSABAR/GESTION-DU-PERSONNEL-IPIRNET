/**
 * dateValidator.js — Validation centralisée des dates côté backend.
 * Utilisé dans toutes les routes qui reçoivent des dates.
 */

const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

/**
 * isValidDate(iso, opts) — Valide une chaîne YYYY-MM-DD.
 * opts: { label, minYear, maxYear, notFuture }
 * Retourne null si OK, ou string d'erreur.
 */
function isValidDate(iso, opts = {}) {
  if (!iso || iso === '' || iso === null) return null; // champ optionnel
  const { label = 'Date', minYear = 1950, maxYear = 2099, notFuture = false } = opts;

  if (typeof iso !== 'string') return `${label} : format invalide (doit être une chaîne YYYY-MM-DD).`;

  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return `${label} : format invalide. Attendu YYYY-MM-DD, reçu : "${iso}".`;

  const year  = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day   = parseInt(m[3], 10);

  if (year  < minYear) return `${label} : l'année ${year} est trop ancienne (minimum ${minYear}).`;
  if (year  > maxYear) return `${label} : l'année ${year} est irréaliste (maximum ${maxYear}).`;
  if (month < 1 || month > 12) return `${label} : mois invalide (${month}).`;
  if (day   < 1 || day   > 31) return `${label} : jour invalide (${day}).`;
  if (notFuture && iso > TODAY()) return `${label} ne peut pas être dans le futur.`;

  return null;
}

/**
 * isOrderValid(isoA, isoB, labelA, labelB) — Vérifie A <= B.
 */
function isOrderValid(isoA, isoB, labelA, labelB) {
  if (!isoA || !isoB) return null;
  if (isoA > isoB) return `"${labelA}" doit être antérieure ou égale à "${labelB}".`;
  return null;
}

/**
 * validate(checks) — Exécute une liste de vérifications.
 * Retourne la première erreur trouvée, ou null si tout est OK.
 */
function validate(checks) {
  for (const err of checks) {
    if (err) return err;
  }
  return null;
}

module.exports = { isValidDate, isOrderValid, validate };
