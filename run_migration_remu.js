const fs = require('fs');
const db = require('./db');

async function run() {
    try {
        const sql = fs.readFileSync('database_update_remunerations.sql', 'utf8');
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const stmt of statements) {
            console.log('Executing:', stmt.substring(0, 50) + '...');
            await db.query(stmt);
        }
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}
run();
