const db = require('./db');

async function alterDb() {
    try {
        await db.query(`ALTER TABLE DOCUMENT_PERSONNEL ADD COLUMN id_absence INT NULL;`);
        await db.query(`ALTER TABLE DOCUMENT_PERSONNEL ADD CONSTRAINT fk_doc_absence FOREIGN KEY (id_absence) REFERENCES ABSENCE(id_absence) ON DELETE CASCADE ON UPDATE CASCADE;`);
        console.log('SQL ALTER Success');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('Column already exists');
        else console.error(e);
    }
    process.exit(0);
}
alterDb();
