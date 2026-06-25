const mysql = require('mysql2/promise');

(async () => {
  try {
    const db = await mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ipirnet'
    });
    
    // Check personnel
    const [rows] = await db.query('SELECT * FROM personnel LIMIT 1');
    if (rows.length > 0) {
      const p = rows[0];
      console.log('=== MYSQL DB ===');
      console.log('DB Raw date_naissance:', p.date_naissance);
      console.log('DB typeof date_naissance:', typeof p.date_naissance);
      if (p.date_naissance instanceof Date) {
         console.log('DB ISODate:', p.date_naissance.toISOString());
         console.log('DB local toString:', p.date_naissance.toString());
      }
      
      // Simuler le comportement de Express (res.json)
      const jsonStr = JSON.stringify(p);
      const parsed = JSON.parse(jsonStr);
      console.log('=== JSON SERIALIZATION ===');
      console.log('JSON Date_naissance:', parsed.date_naissance);
    } else {
      console.log("No personnel found.");
    }
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
