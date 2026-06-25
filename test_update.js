const db = require('./db');

async function test() {
    const id = 7;
    const newEmail = 'ilyassabar37@gmail.com';
    const oldEmail = 'anassabar88@gmail.com';
    const newCin = 'WA327513_1';
    const oldCin = 'WA327513_1';
    
    const [oldRows] = await db.query('SELECT email, cin, id_categorie FROM PERSONNEL WHERE id_personnel = ?', [id]);
    console.log("oldRows from DB:", oldRows);
    
    const old = { email: oldEmail, cin: oldCin, id_categorie: 2 };
    const d = { email: newEmail, cin: newCin, id_categorie: 2 };
    
    let role = null;
    console.log("old.email !== d.email", old.email !== d.email);
    if (old.email !== d.email || old.cin !== d.cin || role !== null) {
        let updateQuery = 'UPDATE UTILISATEUR SET email = ?';
        let updateParams = [d.email];

        if (old.cin !== d.cin) {
            updateQuery += ', mot_de_passe = ?';
            updateParams.push('dummy_hash');
        }
        if (role !== null) {
            updateQuery += ', role = ?';
            updateParams.push(role);
        }
        
        updateQuery += ' WHERE id_personnel = ?';
        updateParams.push(id);

        console.log("Query:", updateQuery);
        console.log("Params:", updateParams);
        
        try {
            const [res] = await db.query(updateQuery, updateParams);
            console.log("Result:", res);
        } catch (e) {
            console.error("Query Error:", e);
        }
    }
    process.exit();
}

test();
