const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const svgPath = path.join(__dirname, 'public', 'assets', 'logo-ipirnet.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  // Render 4000x4800
  await page.setViewport({ width: 4000, height: 4800, deviceScaleFactor: 1 });
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: transparent; overflow: hidden; display: flex; justify-content: center; align-items: center; width: 4000px; height: 4800px; }
        svg { width: 100%; height: 100%; object-fit: contain; }
      </style>
    </head>
    <body>${svgContent}</body>
    </html>
  `;
  await page.setContent(html);
  
  await page.screenshot({
    path: path.join(__dirname, 'public', 'assets', 'logo-ipirnet-transparent.png'),
    omitBackground: true
  });
  
  // Render 256x256
  await page.setViewport({ width: 256, height: 256, deviceScaleFactor: 1 });
  const faviconHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: transparent; overflow: hidden; display: flex; justify-content: center; align-items: center; width: 256px; height: 256px; }
        svg { width: 100%; height: 100%; object-fit: contain; }
      </style>
    </head>
    <body>${svgContent}</body>
    </html>
  `;
  await page.setContent(faviconHtml);
  
  const faviconPath = path.join(__dirname, 'public', 'assets', 'favicon-ipirnet.png');
  await page.screenshot({
    path: faviconPath,
    omitBackground: true,
    clip: { x: 0, y: 0, width: 256, height: 256 }
  });

  await browser.close();
  console.log("Images generated successfully.");
})();
