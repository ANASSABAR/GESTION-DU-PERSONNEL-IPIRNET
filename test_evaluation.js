const puppeteer = require('puppeteer');

const users = [
  { role: 'Administration', email: 'anassabar37@gmail.com', pass: 'password123' },
  { role: 'Responsable pédagogique', email: 'bakri@gestion.ma', pass: 'password123' },
  { role: 'Secrétaire', email: 'hmdani@gestion.ma', pass: 'password123' },
  { role: 'Formateur', email: 'ihsane@gestion.ma', pass: 'password123' }
];

async function runTests() {
  const browser = await puppeteer.launch({ headless: true });

  for (const user of users) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('[PAGE ERROR]', msg.text());
    });
    page.on('pageerror', err => console.log('[PAGE EXCEPTION]', err.toString()));
    
    // Setup Phase for Administration ONLY: Create an evaluation and get its ID
    if (user.role === 'Administration') {
      console.log(`\n========================================`);
      console.log(`[SETUP] Creating test evaluation with Administration...`);
      await page.goto('http://localhost:3000/login.html');
      await page.type('#email', user.email);
      await page.type('#password', user.pass);
      await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]')
      ]);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      await page.evaluate(async (token) => {
        // Find a personnel ID
        const pRes = await fetch('/api/personnel', { headers: { 'Authorization': 'Bearer ' + token }});
        const pRows = await pRes.json();
        const pid = pRows[0]?.id_personnel || 1;
        window.testPid = pid;
        // Create evaluation
        await fetch('/api/evaluations', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_personnel: pid, date_evaluation: new Date().toISOString().split('T')[0], note: 16.5, commentaire: 'Test evaluation' })
        });
      }, token);
      global.testPid = await page.evaluate(() => window.testPid);
      console.log(`[SETUP] Evaluation created for id_personnel = ${global.testPid}`);
      await page.evaluate(() => localStorage.clear());
    }

    console.log(`\n========================================`);
    console.log(`Testing Fiche Évaluation for role: ${user.role} (${user.email})`);
    
    // 1. Login
    console.log(`[+] Logging in...`);
    await page.goto('http://localhost:3000/login.html');
    await page.type('#email', user.email);
    await page.type('#password', user.pass);
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    console.log(`[+] Logged in successfully`);

    // 2. Open fiche-evaluation.html with an arbitrary id_personnel = 1
    // Even if it fails to find an evaluation, the test should just load the page and fetch the data.
    console.log(`[+] Loading fiche-evaluation.html?id_personnel=1...`);
    
    // Mock window.print to prevent hanging
    await page.evaluateOnNewDocument(() => {
      window.print = () => console.log('[MOCK] window.print() called');
    });

    await page.goto(`http://localhost:3000/fiches/fiche-evaluation.html?id_personnel=${global.testPid}`);
    
    // Wait for the fetch to complete
    await new Promise(r => setTimeout(r, 2000));

    // Check if the data was populated or if alert was shown
    const nomText = await page.$eval('#val-nom-complet', el => el.textContent);
    console.log(`[+] #val-nom-complet is: ${nomText}`);
    
    if (nomText === '-') {
      console.log(`[-] Warning: Data was not populated (might not exist or failed). Check logs.`);
    } else {
      console.log(`[+] Success! Data populated: ${nomText}`);
    }

    await context.close();
  }

  await browser.close();
}

runTests().catch(console.error);
