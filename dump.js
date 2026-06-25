const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
    try {
        const conn = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3307,
            user: 'root',
            database: 'gestion_personnel'
        });
        const [tables] = await conn.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        const schema = {};
        for (let row of tables) {
            const tname = Object.values(row)[0];
            try {
                const [cols] = await conn.query('DESCRIBE ' + tname);
                schema[tname] = cols;
            } catch (e) {
                console.error('Error on ' + tname, e.message);
            }
        }
        fs.writeFileSync('db_schema_utf8.json', JSON.stringify(schema, null, 2), 'utf8');
        await conn.end();
        console.log('Schema dumped successfully to db_schema_utf8.json');
    } catch (e) {
        console.error(e);
    }
}
run();
