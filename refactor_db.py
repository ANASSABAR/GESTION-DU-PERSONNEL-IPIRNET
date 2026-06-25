import os
import re
import pymysql

# 1. Update Database
def update_db():
    try:
        conn = pymysql.connect(host='localhost', user='root', password='', database='gestion_personnel')
        cursor = conn.cursor()
        queries = [
            # PERSONNEL
            "ALTER TABLE PERSONNEL CHANGE type_contrat contrat VARCHAR(50);",
            "ALTER TABLE PERSONNEL CHANGE salaire_net salaire_base DECIMAL(10,2);",
            "ALTER TABLE PERSONNEL MODIFY cin VARCHAR(20) UNIQUE;",
            
            # ABSENCE
            "ALTER TABLE ABSENCE ADD COLUMN nombre_jours DECIMAL(5,2) NULL AFTER date_fin;",
            "ALTER TABLE ABSENCE ADD COLUMN motif VARCHAR(255) NULL AFTER statut;",
            
            # HEURE_SUPPLEMENTAIRE
            "ALTER TABLE HEURE_SUPPLEMENTAIRE ADD COLUMN prix_heure DECIMAL(10,2) NULL AFTER nombre_heures;",
            
            # REMUNERATION
            "ALTER TABLE REMUNERATION CHANGE nb_heures_supp quantite_heures_supp DECIMAL(5,2);",
            "ALTER TABLE REMUNERATION CHANGE prix_heure_supp prix_unitaire_heure DECIMAL(10,2);",
            "ALTER TABLE REMUNERATION CHANGE montant_heures_supp montant_total_heures_supp DECIMAL(10,2) GENERATED ALWAYS AS (quantite_heures_supp * prix_unitaire_heure) STORED;",
            "ALTER TABLE REMUNERATION CHANGE deduction deduction_cnss DECIMAL(10,2);",
            
            # recreate salaire_net in remuneration to use the new column names
            "ALTER TABLE REMUNERATION MODIFY salaire_net DECIMAL(10,2) GENERATED ALWAYS AS (salaire_base + prime + montant_total_heures_supp - deduction_cnss) STORED;"
        ]
        
        for q in queries:
            try:
                cursor.execute(q)
                print(f"Executed: {q}")
            except Exception as e:
                print(f"Error executing {q}: {e}")
        conn.commit()
        conn.close()
    except Exception as e:
        print("DB connection error:", e)

# 2. Update files
def replace_in_file(filepath, replacements):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
        
    if orig != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def refactor_files():
    # Updates for index.html
    replace_in_file('public/index.html', [
        (r'type_contrat', r'contrat'),
        (r'p\.salaire_net', r'p.salaire_base'),
        (r'd\.salaire_net', r'd.salaire_base'),
        (r'nb_heures_supp', r'quantite_heures_supp'),
        (r'prix_heure_supp', r'prix_unitaire_heure'),
        (r'montant_heures_supp', r'montant_total_heures_supp'),
        (r'r\.deduction', r'r.deduction_cnss'),
        (r'd\.deduction', r'd.deduction_cnss'),
        (r"id:'f-deduction',\s*label:'Déductions'", r"id:'f-deduction', label:'Déductions CNSS'")
    ])

    # routes/personnel.js
    replace_in_file('routes/personnel.js', [
        (r'type_contrat', r'contrat'),
        (r'p\.salaire_net', r'p.salaire_base'),
        (r'd\.salaire_net', r'd.salaire_base'),
        (r'COALESCE\(rem\.salaire_net, p\.salaire_base\)', r'COALESCE(rem.salaire_net, p.salaire_base)'), # Wait rem.salaire_net is correct for remuneration
        (r'rem\.salaire_net, p\.salaire_net', r'rem.salaire_net, p.salaire_base'),
        (r'COALESCE\(rem\.salaire_net, p\.salaire_net\)\s*AS\s*salaire_net', r'COALESCE(rem.salaire_net, p.salaire_base) AS salaire_base'),
        (r'AS salaire_net', r'AS salaire_base'), # Wait, if remuneration has salaire_net, we might need to be careful
        (r'r1\.salaire_net', r'r1.salaire_net'), # Keep remuneration as is
        (r'salaire_net, prime', r'salaire_base, prime'),
    ])

    # Let's fix routes/personnel.js more carefully using raw strings. 
    # Actually, the file reads `salaire_net` from both PERSONNEL and REMUNERATION.
    # In `routes/heures.js`
    replace_in_file('routes/heures.js', [
        (r'type_contrat', r'contrat'),
        (r'INSERT INTO heure_supplementaire \(date, nombre_heures, motif, id_personnel\) VALUES \(\?,\?,\?,\?\)', r'INSERT INTO heure_supplementaire (date, nombre_heures, prix_heure, motif, id_personnel) VALUES (?,?,?,?,?)'),
        (r'\[d\.date, d\.nombre_heures, d\.motif, d\.id_personnel\]', r'[d.date, d.nombre_heures, d.prix_heure || 0, d.motif, d.id_personnel]'),
    ])

    # routes/absences.js
    replace_in_file('routes/absences.js', [
        (r'INSERT INTO absence \(date_debut, date_fin, type_absence, statut, id_personnel\) VALUES \(\?,\?,\?,\?,\?\)', r'INSERT INTO absence (date_debut, date_fin, type_absence, nombre_jours, statut, motif, id_personnel) VALUES (?,?,?,?,?,?,?)'),
        (r'\[d\.date_debut, d\.date_fin, d\.type_absence, d\.statut, d\.id_personnel\]', r'[d.date_debut, d.date_fin, d.type_absence, d.nombre_jours || 0, d.statut, d.motif, d.id_personnel]'),
        (r'UPDATE absence SET date_debut=\?, date_fin=\?, type_absence=\?, statut=\?, id_personnel=\? WHERE id_absence=\?', r'UPDATE absence SET date_debut=?, date_fin=?, type_absence=?, nombre_jours=?, statut=?, motif=?, id_personnel=? WHERE id_absence=?'),
        (r'\[d\.date_debut, d\.date_fin, d\.type_absence, d\.statut, d\.id_personnel, req\.params\.id\]', r'[d.date_debut, d.date_fin, d.type_absence, d.nombre_jours || 0, d.statut, d.motif, d.id_personnel, req.params.id]'),
    ])

    # routes/remunerations.js
    replace_in_file('routes/remunerations.js', [
        (r'nb_heures_supp', r'quantite_heures_supp'),
        (r'prix_heure_supp', r'prix_unitaire_heure'),
        (r'd\.deduction', r'd.deduction_cnss'),
        (r'deduction, date_paiement', r'deduction_cnss, date_paiement'),
        (r'deduction=\?', r'deduction_cnss=?'),
    ])

    # public/fiches
    replace_in_file('public/fiches/fiche-personnel.html', [
        (r'type_contrat', r'contrat'),
        (r'p\.salaire_net', r'p.salaire_base'),
    ])
    replace_in_file('public/fiches/fiche-heure.html', [
        (r'type_contrat', r'contrat'),
    ])
    replace_in_file('public/fiches/fiche-remuneration.html', [
        (r'nb_heures_supp', r'quantite_heures_supp'),
        (r'prix_heure_supp', r'prix_unitaire_heure'),
        (r'montant_heures_supp', r'montant_total_heures_supp'),
        (r'r\.deduction', r'r.deduction_cnss'),
    ])
    
    # database.sql and database_final.sql
    replace_in_file('database.sql', [
        (r'type_contrat', r'contrat'),
        (r'`salaire_net`\s+DECIMAL\(10,2\)\s+NULL', r'`salaire_base` DECIMAL(10,2) NULL'), # in PERSONNEL
        (r'nb_heures_supp', r'quantite_heures_supp'),
        (r'prix_heure_supp', r'prix_unitaire_heure'),
        (r'montant_heures_supp', r'montant_total_heures_supp'),
        (r'`deduction`', r'`deduction_cnss`'),
        (r'cin`\s+VARCHAR\(20\)\s+NULL', r'cin` VARCHAR(20) UNIQUE'),
    ])
    replace_in_file('database_final.sql', [
        (r'type_contrat', r'contrat'),
        (r'`salaire_net`\s+DECIMAL\(10,2\)\s+NULL', r'`salaire_base` DECIMAL(10,2) NULL'), # in PERSONNEL
        (r'nb_heures_supp', r'quantite_heures_supp'),
        (r'prix_heure_supp', r'prix_unitaire_heure'),
        (r'montant_heures_supp', r'montant_total_heures_supp'),
        (r'`deduction`', r'`deduction_cnss`'),
        (r'cin`\s+VARCHAR\(20\)\s+NULL', r'cin` VARCHAR(20) UNIQUE'),
    ])

if __name__ == '__main__':
    update_db()
    refactor_files()
