import docx
from docx.oxml import OxmlElement

doc = docx.Document(r'C:\xampp\htdocs\IP\Dictionnaire_Donnees_Gestion_Personnel_Final.docx')

def add_row(table, data):
    row = table.add_row()
    for i, val in enumerate(data):
        row.cells[i].text = str(val)

def replace_table_content(table, data_rows):
    # keep header row
    for row in table.rows[1:]:
        table._tbl.remove(row._tr)
    for d in data_rows:
        add_row(table, d)

# Find tables dynamically by checking the first data row's first column (assuming it matches the PK name)
for table in doc.tables:
    if len(table.rows) > 1:
        first_col = table.rows[1].cells[0].text.strip().lower()
        
        if first_col == 'id_personnel':
            # Update PERSONNEL
            replace_table_content(table, [
                ['id_personnel', 'INT', '11', 'PK', 'NOT NULL'],
                ['nom', 'VARCHAR', '100', '', 'NOT NULL'],
                ['prenom', 'VARCHAR', '100', '', 'NOT NULL'],
                ['telephone', 'VARCHAR', '20', '', 'NULL'],
                ['email', 'VARCHAR', '150', 'UNIQUE', 'NOT NULL'],
                ['cin', 'VARCHAR', '20', 'UNIQUE', 'NOT NULL'],
                ['adresse', 'TEXT', '-', '', 'NULL'],
                ['sexe', 'VARCHAR', '10', '', 'NULL'],
                ['date_naissance', 'DATE', '-', '', 'NULL'],
                ['date_recrutement', 'DATE', '-', '', 'NULL'],
                ['contrat', 'VARCHAR', '50', '', 'NULL'],
                ['salaire_base', 'DECIMAL', '10,2', '', 'NULL'],
                ['statut', 'ENUM', "'Actif','Essai','Congé','Inactif'", '', 'NOT NULL'],
                ['id_categorie', 'INT', '11', 'FK', 'NOT NULL']
            ])
            
        elif first_col == 'id_absence':
            # Update ABSENCE
            replace_table_content(table, [
                ['id_absence', 'INT', '11', 'PK', 'NOT NULL'],
                ['type_absence', 'VARCHAR', '100', '', 'NULL'],
                ['date_debut', 'DATE', '-', '', 'NOT NULL'],
                ['date_fin', 'DATE', '-', '', 'NOT NULL'],
                ['nombre_jours', 'DECIMAL', '5,2', '', 'NULL'],
                ['statut', 'ENUM', "'En attente','Justifiée','Non justifiée'", '', 'NOT NULL'],
                ['motif', 'VARCHAR', '255', '', 'NULL'],
                ['id_personnel', 'INT', '11', 'FK', 'NOT NULL']
            ])
            
        elif first_col == 'id_heure_sup':
            # Update HEURE_SUPPLEMENTAIRE
            replace_table_content(table, [
                ['id_heure_sup', 'INT', '11', 'PK', 'NOT NULL'],
                ['date', 'DATE', '-', '', 'NOT NULL'],
                ['nombre_heures', 'DECIMAL', '5,2', '', 'NOT NULL'],
                ['prix_heure', 'DECIMAL', '10,2', '', 'NULL'],
                ['motif', 'VARCHAR', '255', '', 'NULL'],
                ['id_personnel', 'INT', '11', 'FK', 'NOT NULL']
            ])
            
        elif first_col == 'id_remuneration':
            # Update REMUNERATION
            replace_table_content(table, [
                ['id_remuneration', 'INT', '11', 'PK', 'NOT NULL'],
                ['salaire_base', 'DECIMAL', '10,2', '', 'NOT NULL'],
                ['prime', 'DECIMAL', '10,2', '', 'NOT NULL'],
                ['quantite_heures_supp', 'DECIMAL', '5,2', '', 'NULL'],
                ['prix_unitaire_heure', 'DECIMAL', '10,2', '', 'NULL'],
                ['montant_total_heures_supp', 'DECIMAL', '10,2', '', 'NULL'],
                ['deduction_cnss', 'DECIMAL', '10,2', '', 'NOT NULL'],
                ['salaire_net', 'DECIMAL', '10,2', '', 'NULL'],
                ['date_paiement', 'DATE', '-', '', 'NULL'],
                ['id_personnel', 'INT', '11', 'FK', 'NOT NULL']
            ])
            
        elif first_col == 'id_document':
            # Update DOCUMENT_PERSONNEL
            replace_table_content(table, [
                ['id_document', 'INT', '11', 'PK', 'NOT NULL'],
                ['type_document', 'ENUM', '...', '', 'NOT NULL'],
                ['date_depot', 'DATE', '-', '', 'NULL'],
                ['chemin_fichier', 'VARCHAR', '255', '', 'NULL'],
                ['id_personnel', 'INT', '11', 'FK', 'NULL'],
                ['id_absence', 'INT', '11', 'FK', 'NULL'],
                ['id_heure_sup', 'INT', '11', 'FK', 'NULL'],
                ['id_remuneration', 'INT', '11', 'FK', 'NULL']
            ])

doc.save(r'C:\xampp\htdocs\IP\Dictionnaire_Donnees_Gestion_Personnel_Final.docx')
print('Docx saved successfully.')
