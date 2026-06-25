const fs = require('fs');
const h = fs.readFileSync('public/index.html', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = scriptRegex.exec(h)) !== null) {
  fs.writeFileSync(`temp_${i}.js`, match[1]);
  try {
    require('child_process').execSync(`node -c temp_${i}.js`, {stdio:'inherit'});
    console.log(`temp_${i}.js syntax OK`);
  } catch (e) {
    console.error(`temp_${i}.js syntax ERROR`);
  }
  i++;
}
