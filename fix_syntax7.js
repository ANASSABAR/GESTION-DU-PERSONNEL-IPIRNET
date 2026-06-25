const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const lines = html.split('\n');
let insideMap = false;
let mapHasBrace = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.includes('const trs = rows.map(')) {
    insideMap = true;
    if (line.includes('=>`')) {
      mapHasBrace = false;
    } else {
      mapHasBrace = true;
    }
  }

  // We are looking for the closing of the map.
  // It could be on the same line as </tr> or the lines after.
  if (insideMap && line.includes('</tr>')) {
    // Let's clear the lines after this until we see .join
    let j = i;
    let foundJoin = false;
    while (j < lines.length && j < i + 3) {
      if (lines[j].includes('.join')) {
        foundJoin = true;
        break;
      }
      j++;
    }
    
    if (foundJoin) {
      // The end of the map is found
      // We will replace line i to j with the correct lines
      const baseLine = lines[i].substring(0, lines[i].indexOf('</tr>') + 5); // up to </tr>
      
      if (mapHasBrace) {
        lines[i] = baseLine + '`;';
        lines[j] = '    }).join(\\'\\');';
        // if j was i+1, that's fine. If j was i, we combine them.
        if (i === j) {
           lines[i] = baseLine + '`; }).join(\\'\\');';
        } else {
           for (let k = i+1; k < j; k++) lines[k] = '';
        }
      } else {
        lines[i] = baseLine + '`).join(\\'\\');';
        if (i !== j) {
          for (let k = i+1; k <= j; k++) lines[k] = '';
        }
      }
      insideMap = false;
    }
  }
}

fs.writeFileSync('public/index.html', lines.join('\n'));
console.log('Fixed line by line!');
