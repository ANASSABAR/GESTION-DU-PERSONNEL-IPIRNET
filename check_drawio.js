const fs = require('fs');

const xmlPath = 'c:/xampp/htdocs/IP/Untitled Diagram.drawio';
let xml = fs.readFileSync(xmlPath, 'utf8');

// The drawio is likely compressed or uncompressed. Let's check if it starts with <mxfile
if (!xml.includes('<mxGraphModel')) {
    console.log("Diagram might be compressed. Cannot edit raw text easily if compressed.");
}

console.log(xml.substring(0, 200));

// We'll search for DOCUMENT_PERSONNEL to see if it is plain text
let match = xml.match(/DOCUMENT_PERSONNEL/);
if (match) {
    console.log("Found DOCUMENT_PERSONNEL text in XML.");
} else {
    console.log("Text NOT found. Might be encoded/compressed.");
}
