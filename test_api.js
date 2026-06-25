const http = require('http');
const db = require('./db');

async function test() {
    try {
        // 1. Get a token for Admin
        const [users] = await db.query("SELECT email, cin FROM PERSONNEL WHERE nom='SABAR' AND prenom='Anas'");
        const admin = users[0];
        
        const postData = JSON.stringify({ email: admin.email, password: admin.cin });
        
        const loginReq = http.request({
            hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const token = JSON.parse(data).token;
                console.log('Got token:', token ? 'Yes' : 'No');
                
                // 2. Update Personnel ID 7 (Ilyas)
                const updateData = JSON.stringify({
                    nom: 'SABAR', prenom: 'ILYAS', email: 'ilyassabar_test@gmail.com', cin: 'WA327513_NEW',
                    date_naissance: '2008-02-29', telephone: '0679337183', adresse: '126',
                    date_recrutement: '2025-06-18', statut: 'Congé', id_categorie: 2, sexe: 'Homme', type_contrat: 'CDD'
                });
                
                const putReq = http.request({
                    hostname: 'localhost', port: 3000, path: '/api/personnel/7', method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(updateData), 'Authorization': 'Bearer ' + token }
                }, (res2) => {
                    let data2 = '';
                    res2.on('data', chunk => data2 += chunk);
                    res2.on('end', async () => {
                        console.log('Update response:', data2);
                        const [u] = await db.query('SELECT email FROM UTILISATEUR WHERE id_personnel=7');
                        console.log('User email in DB:', u[0].email);
                        process.exit(0);
                    });
                });
                putReq.write(updateData);
                putReq.end();
            });
        });
        loginReq.write(postData);
        loginReq.end();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

test();
