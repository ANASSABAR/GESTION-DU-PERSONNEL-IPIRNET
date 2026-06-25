const db = require('./db');
async function run() {
  const [rows] = await db.query('SELECT salaire_base, prime, deduction_cnss, amo, cimr, ir, salaire_imposable, net_a_payer FROM remuneration ORDER BY id_remuneration DESC LIMIT 5');
  console.log(rows);
  process.exit();
}
run();
