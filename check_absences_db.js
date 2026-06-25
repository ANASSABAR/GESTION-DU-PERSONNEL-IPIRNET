const db = require('./db');

async function checkDb() {
  try {
    const tableInfo = await db.query('DESCRIBE absence');
    console.log("Schema:", tableInfo);

    const distinctTypes = await db.query('SELECT DISTINCT type_absence FROM absence');
    console.log("Distinct types:", distinctTypes);

    const distinctStatut = await db.query('SELECT DISTINCT statut FROM absence');
    console.log("Distinct statuts:", distinctStatut);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkDb();
