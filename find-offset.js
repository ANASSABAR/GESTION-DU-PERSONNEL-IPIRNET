const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 600 });
  
  let bestOffset = -1;
  let minCenterPixels = Infinity;

  // We test offsets from 0 to 938 in steps of 10
  for (let offset = 0; offset <= 938; offset += 10) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><style>body{margin:0;background:#fff;}</style></head>
      <body>
        <svg viewBox="0 0 500 600" width="500" height="600">
          <ellipse cx="250" cy="300" rx="195" ry="95" fill="none" stroke="#76B900" stroke-width="11" stroke-linecap="round" transform="rotate(-35, 250, 300)" stroke-dasharray="310 159" stroke-dashoffset="${offset}"/>
        </svg>
      </body>
      </html>
    `;
    await page.setContent(html);
    
    // Check pixels in the center rect (x=150 to 350, y=150 to 450)
    // Wait, the ellipse goes through the center. We want NO pixels in the center rect.
    const centerPixels = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      const svg = document.querySelector('svg');
      const xml = new XMLSerializer().serializeToString(svg);
      
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(150, 200, 200, 200); // central box 200x200
          let count = 0;
          for(let i=0; i<imageData.data.length; i+=4) {
            // Check if pixel is not white
            if(imageData.data[i+1] > 100 && imageData.data[i] < 200) { // Greenish
              count++;
            }
          }
          resolve(count);
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(xml);
      });
    });
    
    if (centerPixels < minCenterPixels) {
      minCenterPixels = centerPixels;
      bestOffset = offset;
    }
  }
  
  console.log('Best offset:', bestOffset, 'with center pixels:', minCenterPixels);
  
  // Now fine-tune around bestOffset
  let preciseOffset = bestOffset;
  for(let offset = bestOffset - 20; offset <= bestOffset + 20; offset++) {
    // ... we can just trust bestOffset
  }

  await browser.close();
})();
