const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function go() {
  const p = mysql.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'gestion_personnel'
  });
  
  const hash = bcrypt.hashSync('password123', 10);
  console.log("Setting hash to:", hash);
  await p.query('UPDATE utilisateur SET mot_de_passe = ?', [hash]);
  console.log("Passwords updated successfully.");
  process.exit(0);
}

go();
