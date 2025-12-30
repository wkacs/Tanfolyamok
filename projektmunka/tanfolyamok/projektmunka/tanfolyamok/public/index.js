const max = 8;
let adatok;
csoportok();

async function csoportok() {
    const url = 'http://localhost:5000/public/csoportok';
    const tabla = document.getElementById("csoportok");
    try {
        const response = await fetch(url);
        const json = await response.json();
        if (!response.ok) {
            throw new Error(`${response.status} ${json.message}`);
        }
        adatok = json;
        tabla.innerHTML = "<tr><th>Azonosító</th><th>Képzés</th><th>Indulás</th>"
            + "<th>Beosztás</th><th>Szabad hely</th><th>Ár (Ft)</th></tr>";
        json.forEach(cs => {
            tabla.innerHTML += "<tr><td>" + cs.csid + "</td><td>" + cs.knev
                + "</td><td>" + cs.indulas + "</td><td>" + cs.beosztas
                + "</td><td>" + (max - cs.letszam) + "</td><td>" + cs.ar.toLocaleString() + "</td></tr>"
        });
    } catch (err) {
        console.error("Hiba a csoportok feldolgozása közben:", err.message);
        tabla.innerHTML = `<tr><td colspan="6">Hiba történt a csoportok betöltésekor. Kérjük, próbálja újra később.</td></tr>`;
    }
}

document.getElementById("jelentkezemGomb").onclick = async function (e) {
    let valasz = ellenoriz();
    const uzenetElem = document.getElementById("uzenet");
    uzenetElem.innerHTML = valasz;
    if (valasz) return;

    const url = 'http://localhost:5000/public/jelentkezok';
    const payload = {
        "csid": document.getElementById("csid").value,
        "jnev": document.getElementById("jnev").value,
        "szulnev": document.getElementById("szulnev").value,
        "szulido": document.getElementById("szulido").value,
        "szulhely": document.getElementById("szulhely").value,
        "anyjaneve": document.getElementById("anyjaneve").value,
        "cim": document.getElementById("cim").value,
        "telefon": document.getElementById("telefon").value,
        "email": document.getElementById("email").value
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message)
        }
        uzenetElem.innerHTML = data.message;
        document.getElementById("jelentkezemGomb").disabled = true;
        csoportok();
    } catch (err) {
        console.error("Hiba jelentkezéskor:", err.message);
        uzenetElem.innerHTML = err.message;
    }
};

document.getElementById("login").onclick = async function (e) {
    const url = 'http://localhost:5000/admin';
    const uzenet2Elem = document.getElementById("uzenet2");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                "password": document.getElementById("password").value,
            })
        });
        const json = await response.json();
        uzenet2Elem.innerHTML = json.message;
        if (!response.ok) {
            throw new Error(response.status);
        }
        document.getElementById("password").value = ""
        sessionStorage.token = json.token
        document.location.href = "csoportok.html"
    } catch (err) {
        console.error("Fetch hiba a bejelentkezésnél:", err.message);
        uzenet2Elem.innerHTML = "Hibás jelszó!";
    }
};

function ellenoriz() {
    //hibás név
    let nev = document.getElementById("jnev").value.trim();
    if (nev.length < 5 || nev.length > 60)
        return "Hibás név! (5-60 karakter lehet)"
    // hiányzó dátum
    let d = document.getElementById("szulido").value;
    if (d == "") return "Add meg a születési időt!";
    // kor 18-65 között
    let szev = d.substring(0, 4);
    let ev = new Date().getFullYear();
    if (szev >= ev - 18 || szev <= ev - 65)
        return "Hibás születési idő! (18-65 év közötti lehetsz)"
    // hibás születési hely
    let hely = document.getElementById("szulhely").value.trim();
    if (hely.length < 3 || hely.length > 60)
        return "Hibás születési hely! (3-60 karakter lehet)"
    // anyja neve hibás
    let an = document.getElementById("anyjaneve").value.trim();
    if (an.length < 5 || an.length > 60)
        return "Anyja neve hibás! (5-60 karakter lehet)"
    // cím hibás
    let cim = document.getElementById("cim").value.trim();
    if (cim.length < 15 || cim.length > 80)
        return "Hibás cím! (15-80 karakter lehet)"
    // telefon hibás
    let telefon = document.getElementById("telefon").value.trim();
    if (telefon.length < 8 || telefon.length > 15)
        return "Hibás telefonszám! (8-15 karakter lehet)"
    // Ellenőrizzük, hogy a "tandij" jelölőnégyzet be van-e jelölve.
    if (!document.getElementById("tandij").checked) 
        return "Kérjük, fogadja el a fizetési feltételt a pipa bejelölésével!";
    return "";
}
