const db = require('./db');

async function updateDb() {
  try {
    // We just drop motif. type_absence is already varchar(100). We can alter it to ENUM or leave it.
    // Changing to ENUM to enforce data integrity.
    await db.query(`ALTER TABLE absence MODIFY type_absence ENUM('Personnel', 'Formation', 'Maladie', 'Congé', 'Exceptionnelle') DEFAULT 'Personnel'`);
    await db.query(`ALTER TABLE absence DROP COLUMN motif`);
    console.log("DB Updated successfully.");
  } catch (err) {
    if(err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('Column already dropped.');
    } else {
        console.error(err);
    }
  } finally {
    process.exit(0);
  }
}

updateDb();
