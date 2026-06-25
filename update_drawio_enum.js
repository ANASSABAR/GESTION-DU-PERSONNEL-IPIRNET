const fs = require('fs');
const path = 'C:\\xampp\\htdocs\\IP\\Untitled Diagram.drawio';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/type_document \(VARCHAR\)/g, "type_document (ENUM)");
content = content.replace(/type_document, nom_document/g, "type_document (ENUM), nom_document");
content = content.replace(/type_document\\u003c\/b\\u003e: VARCHAR/g, "type_document\\u003c/b\\u003e: ENUM");
// just in case, any generic replace
content = content.replace(/type_document.*?VARCHAR/g, "type_document (ENUM)");

fs.writeFileSync(path, content);
console.log('Drawio updated');
