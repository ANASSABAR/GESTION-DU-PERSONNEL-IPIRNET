// db.js — MySQL connection pool (XAMPP)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     '127.0.0.1',
  port:     3307,           // XAMPP MariaDB port
  user:     'root',
  password: '',             // XAMPP default = empty
  database: 'gestion_personnel',
  charset:  'utf8mb4',
  waitForConnections: true,
  connectionLimit:    10,
  dateStrings:        true, // ← retourne DATE/DATETIME comme "YYYY-MM-DD" (pas objet Date JS)
});

module.exports = pool;
