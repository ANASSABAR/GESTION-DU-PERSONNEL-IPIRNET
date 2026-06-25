/**
 * clean_fiches.js
 * Removes the old print-actions div, old window.onload print(), 
 * and duplicate script tags from the 5 WYSIWYG fiches.
 * Keeps: editor.css, editor.js, the original page template.
 */
const fs = require('fs');
const files = ['livret.html', 'planning.html', 'emploi.html', 'module.html', 'diplome.html'];

files.forEach(file => {
  let html = fs.readFileSync('public/fiches/' + file, 'utf8');

  // 1. Remove the old print-actions div (original print button that conflicts with editor toolbar)
  html = html.replace(/<div class="print-actions"[\s\S]*?<\/div>/g, '');

  // 2. Remove window.onload that auto-triggers print (blocks editor from working)
  //    Pattern: the whole <script> block containing only window.onload + window.print
  html = html.replace(/<script>\s*\n?\s*window\.onload\s*=\s*\(\)\s*=>\s*\{[\s\S]*?window\.print\(\);[\s\S]*?\}\s*\n?\s*<\/script>/g, '');

  // 3. Remove any lingering duplicate editor.js tags (keep only one)
  const editorScriptTag = '<script src="/fiches/editor.js"></script>';
  const count = (html.match(/<script src="\/fiches\/editor\.js"><\/script>/g) || []).length;
  if (count > 1) {
    // Remove all, re-add one before </body>
    html = html.replace(/<script src="\/fiches\/editor\.js"><\/script>/g, '');
    html = html.replace('</body>', editorScriptTag + '\n</body>');
  }

  // 4. Remove any lingering duplicate editor.css links (keep only one)
  const editorCssTag = '<link rel="stylesheet" href="/fiches/editor.css">';
  const cssCount = (html.match(/<link rel="stylesheet" href="\/fiches\/editor\.css">/g) || []).length;
  if (cssCount > 1) {
    html = html.replace(/<link rel="stylesheet" href="\/fiches\/editor\.css">/g, '');
    html = html.replace('</head>', editorCssTag + '\n</head>');
  }

  // 5. Ensure editor.js is present (in case it was missing)
  if (!html.includes('editor.js')) {
    html = html.replace('</body>', editorScriptTag + '\n</body>');
  }

  // 6. Ensure editor.css is present
  if (!html.includes('editor.css')) {
    html = html.replace('</head>', editorCssTag + '\n</head>');
  }

  fs.writeFileSync('public/fiches/' + file, html);
  console.log('✅ Cleaned:', file);
});
console.log('\nDone. All 5 fiches cleaned.');
