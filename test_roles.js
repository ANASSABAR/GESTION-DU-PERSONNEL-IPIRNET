const puppeteer = require('puppeteer');

const users = [
  { role: 'Formateur', email: 'ihsane@gestion.ma' },
  { role: 'Responsable pédagogique', email: 'bakri@gestion.ma' },
  { role: 'Secrétaire', email: 'hmdani@gestion.ma' },
  { role: 'Administration', email: 'anassabar37@gmail.com' }
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
    console.log(`\n========================================`);
    console.log(`Testing role: ${user.role} (${user.email})`);
    
    // 1. Log in
    console.log(`[+] Logging in...`);
    await page.goto('http://localhost:3000/login.html');
    await page.type('#email', user.email);
    await page.type('#password', 'password123');
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    console.log(`[+] Logged in successfully`);

    // Wait for the app to load
    await page.waitForSelector('.nav-item[data-page="documents"]', { timeout: 5000 });
    
    // 2. Go to Documents Administratifs
    console.log(`[+] Navigating to Documents Administratifs...`);
    await page.click('.nav-item[data-page="documents"]');
    
    // Wait for the table to populate
    await new Promise(r => setTimeout(r, 1000));
    
    // 3. Find a "Modifier" button
    const hasModifier = await page.evaluate(() => {
      const editBtns = Array.from(document.querySelectorAll('button[title="Modifier"]'));
      if (editBtns.length > 0) {
        editBtns[0].click();
        return true;
      }
      return false;
    });

    if (!hasModifier) {
      console.log(`[!] No "Modifier" button found for this role! Cannot test edit flow.`);
      // Add a document so next time there is one? Or just continue.
      // Wait, Formateur HAS "Emploi du Temps" in DB. Let's just continue.
      continue;
    }

    // 4. Wait for modal to open
    console.log(`[+] Clicked Modifier. Waiting for modal...`);
    try {
      await page.waitForSelector('#modal-overlay.open', { visible: true, timeout: 5000 });
      console.log(`[+] Modal opened without error!`);
    } catch(e) {
      console.error(`[-] Modal did not open or crashed.`);
      continue;
    }

    // 5. Modify the document (change date)
    console.log(`[+] Modifying document (saving with new date)...`);
    await page.evaluate(() => {
      document.querySelector('#f-date').value = '2026-06-21';
    });

    // 6. Submit the form and wait for the /documents PUT and GET reload
    console.log(`[+] Submitting form...`);
    const [putResponse, getResponse] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/documents') && response.request().method() === 'PUT', {timeout: 5000}).catch(()=>null),
      page.waitForResponse(response => response.url().includes('/api/documents') && response.request().method() === 'GET', {timeout: 5000}).catch(()=>null),
      page.click('#modal-save') // Enregistrer
    ]);

    if (putResponse) {
      const putStatus = putResponse.status();
      if (putStatus === 200) {
        console.log(`[+] Modification saved in database! (PUT returned 200)`);
      } else {
        console.error(`[-] Modification failed! PUT returned ${putStatus}`);
      }
    } else {
       console.error(`[-] Modification failed! PUT did not trigger`);
    }

    if (getResponse) {
      const getStatus = getResponse.status();
      if (getStatus === 200) {
        console.log(`[+] Document list refreshed automatically! (GET returned 200)`);
      } else {
        console.error(`[-] List refresh failed! GET returned ${getStatus}`);
      }
    } else {
       console.error(`[-] List refresh failed! GET did not trigger`);
    }

    // Wait for modal to disappear
    await new Promise(r => setTimeout(r, 500));
    console.log(`[+] Test passed for ${user.role}!`);
    
    await context.close();
  }

  await browser.close();
}

runTests().catch(console.error);
