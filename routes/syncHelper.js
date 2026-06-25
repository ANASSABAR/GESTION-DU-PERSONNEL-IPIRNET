const db = require('../db');

/**
 * Recalculates and updates the salaire_net, prime, and heures_supp columns
 * in the PERSONNEL table for a given personnel ID.
 * @param {number|string} idPersonnel 
 */
async function syncPersonnelMetrics(idPersonnel) {
  if (!idPersonnel) return;
  try {
    // 1. Get current values in PERSONNEL to use as default fallbacks
    const [persRows] = await db.query('SELECT salaire_net, prime, type_contrat FROM PERSONNEL WHERE id_personnel = ?', [idPersonnel]);
    const currentPers = persRows[0] || { salaire_net: null, prime: null, type_contrat: null };

    // Determine prix_heure_supp based on contract
    let prix_heure_supp = 0;
    if (currentPers.type_contrat === 'CDI') prix_heure_supp = 25;
    else if (currentPers.type_contrat === 'CDD') prix_heure_supp = 20;

    // 1b. Recalculate total_hs from heure_supplementaire and push it to remuneration table
    const [hsRows] = await db.query('SELECT COALESCE(SUM(nombre_heures), 0) AS total_hs FROM heure_supplementaire WHERE id_personnel = ?', [idPersonnel]);
    const total_hs = hsRows[0].total_hs;
    await db.query('UPDATE remuneration SET nb_heures_supp = ?, prix_heure_supp = ? WHERE id_personnel = ?', [total_hs, prix_heure_supp, idPersonnel]);

    // 2. Get the latest remuneration (salaire_net, prime) from the remuneration table
    const [remRows] = await db.query(
      'SELECT salaire_net, prime FROM remuneration WHERE id_personnel = ? ORDER BY date_paiement DESC, id_remuneration DESC LIMIT 1',
      [idPersonnel]
    );

    // Use latest remuneration if available, else fallback to current profile value
    const salaire_net = remRows.length > 0 ? parseFloat(remRows[0].salaire_net || 0) : (currentPers.salaire_net != null ? parseFloat(currentPers.salaire_net) : null);
    const prime = remRows.length > 0 ? parseFloat(remRows[0].prime || 0) : (currentPers.prime != null ? parseFloat(currentPers.prime) : null);

    // 4. Update the PERSONNEL table
    await db.query(
      'UPDATE PERSONNEL SET salaire_net = ?, prime = ? WHERE id_personnel = ?',
      [salaire_net, prime, idPersonnel]
    );
    console.log(`[Sync] Updated personnel ${idPersonnel}: salaire_net=${salaire_net}, prime=${prime}`);
  } catch (err) {
    console.error(`[Sync] Error updating personnel ${idPersonnel}:`, err.message);
  }
}

module.exports = { syncPersonnelMetrics };
