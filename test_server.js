const http = require('http');

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {}
        };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
        }
        if (token) {
            options.headers['Authorization'] = 'Bearer ' + token;
        }

        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
                } catch(e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', e => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log("=== API INTEGRATION TESTS ===");
    let token = '';
    
    // Login as Admin
    console.log("1. Logging in as anassabar37@gmail.com...");
    const loginRes = await request('POST', '/api/auth/login', { email: 'anassabar37@gmail.com', password: 'WA327513' });
    if (loginRes.status === 200 && loginRes.body.token) {
        token = loginRes.body.token;
        console.log("✅ Login successful");
    } else {
        console.log("❌ Login failed!", loginRes);
        return;
    }

    // 2. Fetch Personnel
    const persRes = await request('GET', '/api/personnel', null, token);
    let targetPersId = null;
    if (persRes.status === 200 && persRes.body.length > 0) {
        targetPersId = persRes.body[0].id_personnel;
        console.log("✅ Fetched personnel list, selected ID:", targetPersId);
    } else {
        console.log("❌ Failed to fetch personnel", persRes.status);
    }

    // 3. Fetch specific Fiches APIs
    const apis = [
        `/api/personnel/${targetPersId}`,
        `/api/absences`,
        `/api/heures`,
        `/api/remunerations`
    ];

    for (let endpoint of apis) {
        const res = await request('GET', endpoint, null, token);
        if (res.status === 200) {
            console.log(`✅ ${endpoint} -> 200 OK`);
        } else {
            console.log(`❌ ${endpoint} -> ERROR ${res.status}`, res.body);
        }
    }

    // Check specific document APIs
    const docAbsRes = await request('GET', `/api/documents/absence/1`, null, token);
    console.log(`Document Absence /1 status:`, docAbsRes.status);

    console.log("\nAll integration tests complete.");
}

runTests();
