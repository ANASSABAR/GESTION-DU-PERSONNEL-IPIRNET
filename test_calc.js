const db = require('./db');

async function testUpdate() {
  const brut = 8000 + 1400; // 9400
  const deduction_cnss = brut * 0.0448; 
  const amo = brut * 0.0226; 
  const cimr = 0;
  
  let salaire_imposable = brut - deduction_cnss - amo - cimr;
  if (salaire_imposable < 0) salaire_imposable = 0;
  
  let ir = 0;
  let imp = salaire_imposable;
  if (imp > 10000) { ir += (imp - 10000) * 0.20; imp = 10000; }
  if (imp > 6000) { ir += (imp - 6000) * 0.15; imp = 6000; }
  if (imp > 3000) { ir += (imp - 3000) * 0.10; imp = 3000; }
  const net_a_payer = salaire_imposable - ir;

  console.log({ brut, deduction_cnss, amo, salaire_imposable, taux_ir, ir, net_a_payer });
}
testUpdate();
