const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

(async () => {
  try {
    const list = await fetchJson('http://localhost:3000/api/personnel');
    const p1 = list[0];
    console.log("=== LIST API (/api/personnel) ===");
    console.log("Raw date_naissance from JSON:", p1.date_naissance);
    
    if (p1 && p1.id_personnel) {
        const detail = await fetchJson(`http://localhost:3000/api/personnel/${p1.id_personnel}`);
        console.log("=== DETAIL API (/api/personnel/1) ===");
        console.log("Raw date_naissance from JSON:", detail.date_naissance);
    }
  } catch(e) {
    console.error(e);
  }
})();
