const fs = require('fs');
const path = require('path');

const dir = 'c:/xampp/htdocs/IP/ipirnet-app/public/fiches';
const files = ['livret.html', 'planning.html', 'emploi.html', 'module.html', 'diplome.html'];

const dynamicTable = `
<div id="dynamic-personnel-info" style="margin: 20px auto; padding: 20px; background: #181c27; border: 1px solid #2d3343; border-radius: 8px; max-width: 900px; color: #e8eaf0; font-family: 'DM Sans', sans-serif;">
    <h2 style="margin-top:0; margin-bottom: 15px; color: #fff; font-size: 18px; border-bottom: 1px solid #2d3343; padding-bottom: 10px;">Informations du Personnel</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
            <th style="text-align: left; padding: 8px; color: #8892b0; width: 20%; border-bottom: 1px solid #2d3343;">Nom Complet</th>
            <td id="dyn-nom" style="padding: 8px; font-weight: 600; width: 30%; border-bottom: 1px solid #2d3343;">...</td>
            <th style="text-align: left; padding: 8px; color: #8892b0; width: 20%; border-bottom: 1px solid #2d3343;">Catégorie</th>
            <td id="dyn-cat" style="padding: 8px; width: 30%; border-bottom: 1px solid #2d3343;">...</td>
        </tr>
        <tr>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">CIN</th>
            <td id="dyn-cin" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">Type Contrat</th>
            <td id="dyn-contrat" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
        </tr>
        <tr>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">Sexe</th>
            <td id="dyn-sexe" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">Date Recrutement</th>
            <td id="dyn-dr" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
        </tr>
        <tr>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">Date Naissance</th>
            <td id="dyn-dn" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">Salaire Net</th>
            <td id="dyn-salaire" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
        </tr>
        <tr>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">Téléphone</th>
            <td id="dyn-tel" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">Prime</th>
            <td id="dyn-prime" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
        </tr>
        <tr>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">Email</th>
            <td id="dyn-email" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
            <th style="text-align: left; padding: 8px; color: #8892b0; border-bottom: 1px solid #2d3343;">Heures Supp.</th>
            <td id="dyn-heures" style="padding: 8px; border-bottom: 1px solid #2d3343;">...</td>
        </tr>
        <tr>
            <th style="text-align: left; padding: 8px; color: #8892b0;">Adresse</th>
            <td id="dyn-adresse" style="padding: 8px;">...</td>
            <th style="text-align: left; padding: 8px; color: #8892b0;">Statut</th>
            <td id="dyn-statut" style="padding: 8px;">...</td>
        </tr>
    </table>
</div>
`;

const fetchScript = `
<style>
@media print {
  body { background: #fff !important; color: #000 !important; }
  .page { background: #fff !important; box-shadow: none !important; }
  #dynamic-personnel-info { background: #fff !important; border: 1px solid #ccc !important; color: #000 !important; margin: 0 !important; }
  #dynamic-personnel-info h2 { color: #000 !important; border-bottom: 1px solid #000 !important; }
  #dynamic-personnel-info th { color: #333 !important; border-bottom: 1px solid #ccc !important; }
  #dynamic-personnel-info td { color: #000 !important; border-bottom: 1px solid #ccc !important; }
}
</style>
<script>
    function fmtD(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }
    function fmtM(m) { return m != null ? Number(m).toLocaleString('fr-FR') + ' MAD' : '—'; }
    function setTxt(id, val) { const el = document.getElementById(id); if(el) el.textContent = val || '—'; }

    window.onload = function() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
            fetch('/api/personnel/' + id)
                .then(res => res.json())
                .then(p => {
                    setTxt('dyn-nom', p.nom + ' ' + p.prenom);
                    setTxt('dyn-cat', p.libelle_categorie);
                    setTxt('dyn-cin', p.cin);
                    setTxt('dyn-contrat', p.type_contrat);
                    setTxt('dyn-sexe', p.sexe);
                    setTxt('dyn-dr', fmtD(p.date_recrutement));
                    setTxt('dyn-dn', fmtD(p.date_naissance));
                    setTxt('dyn-salaire', fmtM(p.salaire_net));
                    setTxt('dyn-tel', p.telephone);
                    setTxt('dyn-prime', fmtM(p.prime));
                    setTxt('dyn-email', p.email);
                    setTxt('dyn-heures', p.heures_supp != null ? p.heures_supp + ' h' : '—');
                    setTxt('dyn-adresse', p.adresse);
                    setTxt('dyn-statut', p.statut);
                    
                    setTimeout(() => window.print(), 500);
                })
                .catch(err => {
                    console.error(err);
                    setTimeout(() => window.print(), 500);
                });
        } else {
            setTimeout(() => window.print(), 500);
        }
    };
</script>
`;

for (const file of files) {
    const fpath = path.join(dir, file);
    if (!fs.existsSync(fpath)) continue;
    let content = fs.readFileSync(fpath, 'utf8');

    // Remove the old hardcoded print button
    content = content.replace(/<button class="print-btn" onclick="window\.print\(\)">\s*Imprimer.*?\s*<\/button>/gi, '');
    content = content.replace(/<div class="print-actions">\s*<button onclick="window\.print\(\)">.*?<\/button>\s*<\/div>/gi, '');
    
    // Remove the static "Nom Complet" table in livret
    content = content.replace(/<table>\s*<tr>\s*<th>Nom Complet<\/th>.*?<\/table>/gis, '');

    // Inject dynamic table
    if (!content.includes('id="dynamic-personnel-info"')) {
        if (content.includes('</h1>')) {
            content = content.replace(/(<\/h1>\s*)/, '$1' + dynamicTable + '\n');
        } else if (content.includes('class="title-zone"')) {
            content = content.replace(/(<div class="title-zone">.*?<\/div>\s*)/s, '$1' + dynamicTable + '\n');
        } else if (content.includes('<div class="page">')) {
            content = content.replace(/(<div class="page">\s*)/, '$1' + dynamicTable + '\n');
        } else {
            content = content.replace(/(<body.*?>\s*)/, '$1' + dynamicTable + '\n');
        }
    }

    // Inject script
    if (!content.includes("fetch('/api/personnel/")) {
        content = content.replace(/<\/body>/, fetchScript + '\n</body>');
    }

    fs.writeFileSync(fpath, content, 'utf8');
}
console.log('Done');
