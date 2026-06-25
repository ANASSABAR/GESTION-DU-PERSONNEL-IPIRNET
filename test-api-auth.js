const http = require('http');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

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
    const auth = await postJson('http://localhost:3000/api/auth/login', { username: 'admin', password: 'password' });
    const token = auth.token;
    if (!token) throw new Error("No token");

    const list = await getJson('http://localhost:3000/api/personnel', token);
    const p = list.find(x => x.nom === 'IHSANE' || x.prenom === 'IHSANE') || list[0];
    
    console.log("=== LIST API ===");
    console.log(p);
    
    if (p) {
        const detail = await getJson(`http://localhost:3000/api/personnel/${p.id_personnel}`, token);
        console.log("=== DETAIL API ===");
        console.log(detail);
    }
  } catch(e) {
    console.error(e);
  }
})();
