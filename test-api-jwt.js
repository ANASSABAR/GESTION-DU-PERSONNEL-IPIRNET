const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'ipirnet-super-secret-key-2026';
const token = jwt.sign(
  { id: 1, email: 'admin@gestion.ma', nom: 'Admin', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '24h' }
);

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { 'Authorization': 'Bearer ' + token } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

(async () => {
  try {
    const list = await getJson('http://localhost:3000/api/personnel', token);
    const p = list.find(x => x.nom === 'IHSANE' || x.prenom === 'IHSANE' || x.nom === 'REZKALLAH') || list[0];
    
    console.log("=== LIST API ===");
    console.log("ID: " + p.id_personnel);
    console.log("Nom: " + p.nom + " " + p.prenom);
    console.log("Date de Naissance: " + p.date_naissance);
    console.log("Date de Recrutement: " + p.date_recrutement);
    
    if (p) {
        const detail = await getJson(`http://localhost:3000/api/personnel/${p.id_personnel}`, token);
        console.log("\n=== DETAIL API ===");
        console.log("Date de Naissance: " + detail.date_naissance);
        console.log("Date de Recrutement: " + detail.date_recrutement);
    }
  } catch(e) {
    console.error(e);
  }
})();
