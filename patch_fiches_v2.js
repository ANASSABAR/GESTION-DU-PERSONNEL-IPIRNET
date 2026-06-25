const fs = require('fs');

const files = ['livret.html', 'planning.html', 'emploi.html', 'module.html', 'diplome.html'];

files.forEach(file => {
  let html = fs.readFileSync('public/fiches/' + file, 'utf8');
  
  // 1. Remove old dynamic script if exists
  html = html.replace(/<script id="dynamic-script">[\s\S]*?<\/script>/, '');
  
  // 2. Add editor.css to head
  if (!html.includes('editor.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/fiches/editor.css">\n</head>');
  }
  
  // 3. Add editor.js before body end
  if (!html.includes('editor.js')) {
    html = html.replace('</body>', '<script src="/fiches/editor.js"></script>\n</body>');
  }

  fs.writeFileSync('public/fiches/' + file, html);
  console.log('Patched', file);
});
