const db = require('./db');

async function updateOldRecords() {
  try {
    const [rows] = await db.query('SELECT * FROM remuneration');
    
    for (const r of rows) {
      const base = parseFloat(r.salaire_base) || 0;
      const prime = parseFloat(r.prime) || 0;
      const montant_hs = parseFloat(r.montant_total_heures_supp) || 0; // It's generated, we can read it
      
      const brut = base + prime + montant_hs;
      const deduction_cnss = brut * 0.0448; 
      const amo = brut * 0.0226; 
      const cimr = parseFloat(r.cimr) || 0;
      
      let salaire_imposable = brut - deduction_cnss - amo - cimr;
      if (salaire_imposable < 0) salaire_imposable = 0;
      
      let ir = 0;
      let imp = salaire_imposable;
      if (imp > 10000) { ir += (imp - 10000) * 0.20; imp = 10000; }
      if (imp > 6000) { ir += (imp - 6000) * 0.15; imp = 6000; }
      if (imp > 3000) { ir += (imp - 3000) * 0.10; imp = 3000; }
      
      const net_a_payer = salaire_imposable - ir;

      await db.query(`
        UPDATE remuneration 
        SET deduction_cnss=?, amo=?, salaire_imposable=?, ir=?, net_a_payer=? 
        WHERE id_remuneration=?
      `, [deduction_cnss, amo, salaire_imposable, ir, net_a_payer, r.id_remuneration]);
    }
    
    console.log(`Mise à jour de ${rows.length} enregistrements existants réussie.`);
    process.exit(0);
  } catch (e) {
    console.error('Erreur:', e);
    process.exit(1);
  }
}

updateOldRecords();
