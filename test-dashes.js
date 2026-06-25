const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>body { background: #fff; margin: 0; padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style>
    </head>
    <body>
      <!-- Option 1: dasharray 350 119, offset 0 -->
      <svg viewBox="0 0 500 600" width="400" height="480" style="border: 1px solid #ccc">
        <ellipse cx="250" cy="300" rx="195" ry="95" fill="none" stroke="#76B900" stroke-width="11" stroke-linecap="round" transform="rotate(-35, 250, 300)" stroke-dasharray="350 119" stroke-dashoffset="0"/>
      </svg>
      <!-- Option 2: offset 100 -->
      <svg viewBox="0 0 500 600" width="400" height="480" style="border: 1px solid #ccc">
        <ellipse cx="250" cy="300" rx="195" ry="95" fill="none" stroke="#76B900" stroke-width="11" stroke-linecap="round" transform="rotate(-35, 250, 300)" stroke-dasharray="350 119" stroke-dashoffset="100"/>
      </svg>
      <!-- Option 3: offset 200 -->
      <svg viewBox="0 0 500 600" width="400" height="480" style="border: 1px solid #ccc">
        <ellipse cx="250" cy="300" rx="195" ry="95" fill="none" stroke="#76B900" stroke-width="11" stroke-linecap="round" transform="rotate(-35, 250, 300)" stroke-dasharray="350 119" stroke-dashoffset="200"/>
      </svg>
      <!-- Option 4: offset 250 -->
      <svg viewBox="0 0 500 600" width="400" height="480" style="border: 1px solid #ccc">
        <ellipse cx="250" cy="300" rx="195" ry="95" fill="none" stroke="#76B900" stroke-width="11" stroke-linecap="round" transform="rotate(-35, 250, 300)" stroke-dasharray="350 119" stroke-dashoffset="280"/>
      </svg>
    </body>
    </html>
  `;
  await page.setContent(html);
  await page.screenshot({ path: 'test-dashes.png' });
  await browser.close();
})();
