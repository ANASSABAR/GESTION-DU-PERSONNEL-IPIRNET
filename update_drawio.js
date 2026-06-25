const fs = require('fs');

let xmlStr = fs.readFileSync('../Untitled Diagram.drawio', 'utf8');

const tableBlock = `
        <mxCell id="HISTORIQUE_DOC_TABLE" value="HISTORIQUE_DOCUMENT" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="800" y="800" width="250" height="200" as="geometry" />
        </mxCell>
        <mxCell id="HISTORIQUE_DOC_ROW_1" value="" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;top=0;left=0;bottom=0;right=0;collapsible=0;dropTarget=0;fillColor=none;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="HISTORIQUE_DOC_TABLE">
          <mxGeometry y="30" width="250" height="30" as="geometry" />
        </mxCell>
        <mxCell id="HISTORIQUE_DOC_CELL_1" value="id_historique (PK)" style="shape=partialRectangle;html=1;whiteSpace=wrap;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;pointerEvents=1;" vertex="1" parent="HISTORIQUE_DOC_ROW_1">
          <mxGeometry width="250" height="30" as="geometry" />
        </mxCell>
        <mxCell id="HISTORIQUE_DOC_ROW_2" value="" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;top=0;left=0;bottom=0;right=0;collapsible=0;dropTarget=0;fillColor=none;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="HISTORIQUE_DOC_TABLE">
          <mxGeometry y="60" width="250" height="30" as="geometry" />
        </mxCell>
        <mxCell id="HISTORIQUE_DOC_CELL_2" value="type_document, nom_document, chemin_fichier, etc" style="shape=partialRectangle;html=1;whiteSpace=wrap;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;pointerEvents=1;" vertex="1" parent="HISTORIQUE_DOC_ROW_2">
          <mxGeometry width="250" height="30" as="geometry" />
        </mxCell>
`;

xmlStr = xmlStr.replace('</root>', tableBlock + '\n      </root>');
fs.writeFileSync('../Untitled Diagram.drawio', xmlStr);
console.log("Updated drawio.");
