const fs = require('fs');
let html = fs.readFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', 'utf8');

// The file currently has incorrect ends for map functions that start with template string backtick directly.
// The incorrect end looks like this:
// </tr>`;
//     }).join('');

// We need to restore it to:
// </tr>`).join('');

const fixes = [
  {
    start: 'const trs = rows.map(p=>`',
    badEnd: '</tr>`;\n    }).join(\\'\\');'
  },
  {
    start: 'const trs = rows.map(r=>`',
    badEnd: '</tr>`;\n    }).join(\\'\\');'
  },
  {
    start: 'const trs = rows.map(e=>`',
    badEnd: '</tr>`;\n    }).join(\\'\\');'
  }
];

fixes.forEach(fix => {
  let startIndex = html.indexOf(fix.start);
  if (startIndex !== -1) {
    let nextEndIndex = html.indexOf(fix.badEnd, startIndex);
    if (nextEndIndex !== -1) {
      let before = html.substring(0, nextEndIndex);
      let after = html.substring(nextEndIndex + fix.badEnd.length);
      html = before + '</tr>`).join(\\'\\');' + after;
      console.log('Fixed block starting with', fix.start);
    } else {
      console.log('Could not find bad end for', fix.start);
    }
  } else {
    console.log('Could not find start', fix.start);
  }
});

fs.writeFileSync('c:/xampp/htdocs/IP/ipirnet-app/public/index.html', html);
