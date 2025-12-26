require('dotenv').config();
const express = require("express");
const app = express();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const Database = require('better-sqlite3');
app.use(express.json());
app.use(express.static('public'));

// Adatbázis kapcsolat inicializálása
const db = new Database('tanfolyamok.db', { /*verbose: console.log*/ });
db.pragma('journal_mode = WAL'); // Ajánlott a jobb teljesítményért és konkurrenciakezelésért
db.pragma('foreign_keys = ON'); // Idegen kulcsok engedélyezése

// Adatbázis séma inicializálása (táblák és indexek létrehozása)
const createTables = `
    CREATE TABLE IF NOT EXISTS kepzesek (
      kid INTEGER PRIMARY KEY AUTOINCREMENT,
      knev TEXT NOT NULL,
      oraszam INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS csoportok (
      csid INTEGER PRIMARY KEY AUTOINCREMENT,
      kid INTEGER NOT NULL,
      indulas TEXT NOT NULL,
      beosztas TEXT NOT NULL,
      helyszin TEXT NOT NULL,
      ar INTEGER NOT NULL,
      FOREIGN KEY (kid) REFERENCES kepzesek (kid)
    );

    CREATE TABLE IF NOT EXISTS jelentkezok (
      jid INTEGER PRIMARY KEY AUTOINCREMENT,
      csid INTEGER NOT NULL,
      jnev TEXT NOT NULL,
      szulnev TEXT DEFAULT NULL,
      szulido TEXT NOT NULL,
      szulhely TEXT NOT NULL,
      anyjaneve TEXT NOT NULL,
      cim TEXT NOT NULL,
      telefon TEXT NOT NULL,
      email TEXT NOT NULL,
      FOREIGN KEY (csid) REFERENCES csoportok (csid)
    );

    CREATE INDEX IF NOT EXISTS idx_csoportok_kid ON csoportok (kid);
    CREATE INDEX IF NOT EXISTS idx_jelentkezok_csid ON jelentkezok (csid);
`;

try {
    db.exec(createTables);
    console.log("Adatbázis táblák sikeresen inicializálva/ellenőrizve.");
} catch (error) {
    console.error("Hiba az adatbázis táblák inicializálása közben:", error.message);
    process.exit(1); // Kilépés, ha a séma létrehozása sikertelen
}

// *** publikus API *** //

// visszaadja az ezután induló csoportok adatait létszámmal együtt
app.get("/public/csoportok", function (req, res) {
    const q = "SELECT csoportok.csid, kepzesek.knev, indulas, beosztas, ar, "
        + "COUNT(jelentkezok.jid) AS letszam "
        + "FROM kepzesek JOIN csoportok ON csoportok.kid=kepzesek.kid "
        + "LEFT JOIN jelentkezok ON csoportok.csid = jelentkezok.csid "
        + "WHERE indulas >= date('now') GROUP BY csoportok.csid";
    try {
        const stmt = db.prepare(q);
        const results = stmt.all();
        res.status(200).send(results);
    } catch (error) {
        console.error("Hiba /public/csoportok lekérdezésénél:", error.message);
        res.status(500).send({ message: "Adatbázis hiba történt." });
    }
});

// létrehoz egy új jelentkezőt a küldött adatokkal
app.post("/public/jelentkezok", function (req, res) {
    const q = "INSERT INTO jelentkezok (csid, jnev, szulnev, szulido, "
        + "szulhely, anyjaneve, cim, telefon, email) "
        + "VALUES (?,?,?,?,?,?,?,?,?)";
    const { csid, jnev, szulnev, szulido, szulhely, anyjaneve, cim, telefon, email } = req.body;
    if (!csid || !jnev || !szulido || !szulhely || !anyjaneve || !cim || !telefon || !email) {
        return res.status(400).send({ message: "Hiányzó kötelező mezők." });
    }
    try {
        // Ellenőrizzük, hogy a csoport létezik-e és ezután indul-e
        const groupExistsStmt = db.prepare("SELECT kid FROM csoportok WHERE csid = ? AND indulas >= date('now')");
        if (!groupExistsStmt.get(csid)) {
            return res.status(404).send({ message: "Ebbe a csoportba nem lehet jelentkezni." });
        }
        // Ellenőrizzük, hogy ezzel az e-mail címmel jelentkezett-e már erre a csoportra
        const duplicateCheckStmt = db.prepare("SELECT jid FROM jelentkezok WHERE csid = ? AND email = ?");
        if (duplicateCheckStmt.get(csid, email)) {
            return res.status(409).send({ message: "Ezzel az e-mail címmel már jelentkeztek ebbe a csoportba." });
        }
        // Ellenőrizzük a maximális létszámot (8 fő)
        const countQuery = "SELECT COUNT(jid) AS letszam FROM jelentkezok WHERE csid = ?";
        const countStmt = db.prepare(countQuery);
        const countResult = countStmt.get(csid);
        if (countResult.letszam >= 8) {
            return res.status(409).send({ message: "A csoport megtelt, maximum 8 fő jelentkezhet." });
        }
        const stmt = db.prepare(q);
        const info = stmt.run(
            csid, jnev, szulnev, szulido, szulhely, anyjaneve, cim, telefon, email
        );
        res.status(201).send({ message: "Sikeres jelentkezés!", jid: info.lastInsertRowid, changes: info.changes });
    } catch (error) {
        console.error("Hiba /public/jelentkezok létrehozásánál:", error.message);
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).send({ message: "Érvénytelen csoport azonosító (csid)." });
        }
        res.status(500).send({ message: "Adatbázis hiba történt a jelentkezés rögzítésekor." });
    }
});

// *** admin API *** //

// admin bejelentkezés
app.post("/admin", function (req, res) {
    const hash = process.env.ADMIN;
    if (!bcrypt.compareSync(req.body.password, hash))
        return res.status(401).send({ message: "Hibás jelszó!" })
    const token = jwt.sign(
        { password: req.body.password },
        process.env.TOKEN_SECRET,
        { expiresIn: 3600 })
    res.status(200).send({ token: token, message: "Sikeres bejelentkezés." })
});

// token ellenőrzése (middleware)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token)
        return res.status(401).send({ message: "Azonosítás szükséges!" })
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err)
            return res.status(403).send({ message: "Nincs jogosultsága!" })
        req.user = user
        next()
    })
}

// az összes csoport adatainak lekérése
app.get("/admin/csoportok", authenticateToken, function (req, res) {
    const q = "SELECT csoportok.csid, kepzesek.knev, indulas, beosztas, helyszin, ar, "
        + "COUNT(jelentkezok.jid) AS letszam "
        + "FROM kepzesek JOIN csoportok ON csoportok.kid=kepzesek.kid "
        + "LEFT JOIN jelentkezok ON csoportok.csid = jelentkezok.csid "
        + "GROUP BY csoportok.csid ORDER BY indulas DESC";
    try {
        const stmt = db.prepare(q);
        const results = stmt.all();
        res.status(200).send(results);
    } catch (error) {
        console.error("Hiba /admin/csoportok lekérdezésénél:", error.message);
        res.status(500).send({ message: "Adatbázis hiba történt." });
    }
});

// új csoport hozzáadása
app.post("/admin/csoportok", authenticateToken, function (req, res) {
    const { kid, indulas, beosztas, helyszin, ar } = req.body;
    if (!kid || !indulas || !beosztas || !helyszin || !ar) {
        return res.status(400).send({ message: "Hiányzó kötelező mezők." });
    }
    if (ar < 0) {
        return res.status(400).send({ message: "Az ár nem lehet negatív." });
    }
    const q = "INSERT INTO csoportok (kid, indulas, beosztas, helyszin, ar) "
        + "VALUES(?,?,?,?,?)"
    try {
        const stmt = db.prepare(q);
        const info = stmt.run(Number(kid), indulas, beosztas, helyszin, Number(ar));
        res.status(201).send({ message: "Csoport sikeresen hozzáadva!", id: info.lastInsertRowid, changes: info.changes });
    } catch (error) {
        console.error("Hiba /admin/csoportok létrehozásánál:", error.message);
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).send({ message: "Érvénytelen képzés azonosító (kid)." });
        }
        res.status(500).send({ message: "Adatbázis hiba történt a csoport létrehozásakor." });
    }
});

// egy csoport lekérése
app.get("/admin/csoportok/:csid", authenticateToken, function (req, res) {
    const { csid } = req.params;
    const q = "SELECT kid, indulas, beosztas, helyszin, ar "
        + "FROM csoportok WHERE csid=?";
    try {
        const stmt = db.prepare(q);
        const result = stmt.get(Number(csid));
        if (result) {
            res.status(200).send(result);
        } else {
            res.status(404).send({ message: "Csoport nem található." });
        }
    } catch (error) {
        console.error(`Hiba /admin/csoportok/${csid} lekérdezésénél:`, error.message);
        res.status(500).send({ message: "Adatbázis hiba történt." });
    }
});

// csoport módosítása
app.put("/admin/csoportok/:csid", authenticateToken, function (req, res) {
    const { csid } = req.params;
    const { kid, indulas, beosztas, helyszin, ar } = req.body;
    if (!kid || !indulas || !beosztas || !helyszin || !ar) {
        return res.status(400).send({ message: "Hiányzó kötelező mezők." });
    }
    if (ar < 0) {
        return res.status(400).send({ message: "Az ár nem lehet negatív." });
    }
    const q = "UPDATE csoportok "
        + "SET kid=?, indulas=?, beosztas=?, helyszin=?, ar=? "
        + "WHERE csid=?"
    try {
        const stmt = db.prepare(q);
        const info = stmt.run(Number(kid), indulas, beosztas, helyszin, Number(ar), Number(csid));
        if (info.changes > 0) {
            res.status(200).send({ message: "Csoport sikeresen módosítva.", changes: info.changes });
        } else {
            res.status(404).send({ message: "Csoport nem található vagy nem történt módosítás." });
        }
    } catch (error) {
        console.error(`Hiba /admin/csoportok/${csid} módosításánál:`, error.message);
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).send({ message: "Érvénytelen képzés azonosító (kid)." });
        }
        res.status(500).send({ message: "Adatbázis hiba történt a csoport módosításakor." });
    }
})

// csoport törlése
app.delete("/admin/csoportok/:csid", authenticateToken, function (req, res) {
    const { csid } = req.params;
    const q = "DELETE FROM csoportok WHERE csid=?";
    try {
        const stmt = db.prepare(q);
        const info = stmt.run(Number(csid));
        if (info.changes > 0) {
            res.status(200).send({ message: "Csoport sikeresen törölve.", changes: info.changes });
        } else {
            res.status(404).send({ message: "Csoport nem található." });
        }
    } catch (error) {
        console.error(`Hiba /admin/csoportok/${csid} törlésénél:`, error.message);
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error.message.toUpperCase().includes("FOREIGN KEY CONSTRAINT FAILED")) {
            return res.status(400).send({ message: "A csoport nem törölhető, mert vannak hozzá rendelt jelentkezők." });
        }
        res.status(500).send({ message: "Adatbázis hiba történt a csoport törlésekor." });
    }
});

// egy csoport jelentkezőinek listája
app.get("/admin/lista/:csid", authenticateToken, function (req, res) {
    const { csid } = req.params;
    const q = "SELECT jid, jnev, szulnev, szulido, szulhely, anyjaneve, "
        + "cim, telefon, email FROM jelentkezok WHERE csid=? ORDER BY jnev";
    try {
        const groupExistsStmt = db.prepare("SELECT 1 FROM csoportok WHERE csid = ?");
        const group = groupExistsStmt.get(Number(csid));
        if (!group) {
            return res.status(404).send({ message: "A megadott csoport nem létezik." });
        }
        const stmt = db.prepare(q);
        const results = stmt.all(Number(csid));
        res.status(200).send(results);
    } catch (error) {
        console.error(`Hiba /admin/lista/${csid} lekérdezésénél:`, error.message);
        res.status(500).send({ message: "Adatbázis hiba történt." });
    }
});

// egy jelentkező adatai
app.get("/admin/jelentkezok/:jid", authenticateToken, function (req, res) {
    const { jid } = req.params;
    const q = "SELECT * FROM jelentkezok WHERE jid=?";
    try {
        const stmt = db.prepare(q);
        const result = stmt.get(Number(jid));
        if (result) {
            res.status(200).send(result);
        } else {
            res.status(404).send({ message: "Jelentkező nem található." });
        }
    } catch (error) {
        console.error(`Hiba /admin/jelentkezok/${jid} lekérdezésénél:`, error.message);
        res.status(500).send({ message: "Adatbázis hiba történt." });
    }
});

// egy jelentkező adatainak módosítása
app.put("/admin/jelentkezok/:jid", authenticateToken, function (req, res) {
    const { jid } = req.params;
    const { csid, jnev, szulnev, szulido, szulhely, anyjaneve, cim, telefon, email } = req.body;
    // Kötelező mezők ellenőrzése
    if (!csid || !jnev || !szulido || !szulhely || !anyjaneve || !cim || !telefon || !email) {
        return res.status(400).send({ message: "Hiányzó kötelező mezők (csid, jnev, szulido, szulhely, anyjaneve, cim, telefon, email)." });
    }
    const q = "UPDATE jelentkezok "
        + "SET csid=?, jnev=?, szulnev=?, szulido=?, "
        + "szulhely=?, anyjaneve=?, cim=?, telefon=?, email=? "
        + "WHERE jid=?";
    try {
        // Ellenőrizzük, hogy a csoport létezik-e (A maximális létszám túllépését nem vizsgáljuk.)
        const groupExistsStmt = db.prepare("SELECT kid FROM csoportok WHERE csid = ?");
        if (!groupExistsStmt.get(Number(csid))) {
            return res.status(400).send({ message: "A megadott csoport (csid) nem létezik." });
        }
        const stmt = db.prepare(q);
        const info = stmt.run(
            Number(csid), jnev, szulnev, szulido, szulhely, anyjaneve, cim, telefon, email, Number(jid)
        );
        if (info.changes > 0) {
            res.status(200).send({ message: "Jelentkező sikeresen módosítva.", changes: info.changes });
        } else {
            // Lehet, hogy a jelentkező nem létezik, vagy az adatok ugyanazok maradtak
            const checkStmt = db.prepare("SELECT 1 FROM jelentkezok WHERE jid = ?");
            if (!checkStmt.get(Number(jid))) {
                return res.status(404).send({ message: "Jelentkező nem található." });
            }
            res.status(200).send({ message: "Jelentkező adatai nem változtak.", changes: info.changes });
        }
    } catch (error) {
        console.error(`Hiba /admin/jelentkezok/${jid} módosításánál:`, error.message);
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).send({ message: "Érvénytelen csoport azonosító (csid)." });
        }
        res.status(500).send({ message: "Adatbázis hiba történt a jelentkező módosításakor." });
    }
});

// jelentkező törlése
app.delete("/admin/jelentkezok/:jid", authenticateToken, function (req, res) {
    const { jid } = req.params;
    const q = "DELETE FROM jelentkezok WHERE jid=?";
    try {
        const stmt = db.prepare(q);
        const info = stmt.run(Number(jid));

        if (info.changes > 0) {
            res.status(200).send({ message: "Jelentkező sikeresen törölve.", changes: info.changes });
        } else {
            res.status(404).send({ message: "Jelentkező nem található." });
        }
    } catch (error) {
        console.error(`Hiba /admin/jelentkezok/${jid} törlésénél:`, error.message);
        // Itt nem várható foreign key hiba, mert a jelentkezok tábla nem hivatkozik más táblákra,
        // amelyek megakadályoznák a törlést (más táblák hivatkoznak rá).
        res.status(500).send({ message: "Adatbázis hiba történt a jelentkező törlésekor." });
    }
});

app.listen(5000, () => console.log("Server elindítva az 5000-es porton..."))
process.on('exit', () => db.close());
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());
