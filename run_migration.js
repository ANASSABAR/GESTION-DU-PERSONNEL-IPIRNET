const fs = require('fs');
const db = require('./db');

async function runMigration() {
    try {
        const sql = fs.readFileSync('C:\\Users\\net\\.gemini\\antigravity\\brain\\8a47b2d2-9e66-4a64-b0f6-e3695de21a66\\scratch\\migrate_enum.sql', 'utf8');
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        for (const s of statements) {
            console.log('Running:', s.trim().substring(0, 50) + '...');
            await db.query(s);
        }
        console.log('Migration OK');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
runMigration();
