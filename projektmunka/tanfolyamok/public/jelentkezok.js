const csid = sessionStorage.csid
document.getElementById("csid").innerHTML = csid
if (!sessionStorage.token) {
    document.location.replace("index.html")
}
const token = 'Bearer ' + sessionStorage.token
let letszam
const max = 8
jelentkezok()

async function jelentkezok() {
    const url = 'http://localhost:5000/admin/lista/' + csid;
    const tabla = document.getElementById("jelentkezok");
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(`${response.status} ${json.message}`);
        }
        tabla.innerHTML = "<tr><th>Név</th><th>Születési név</th><th>Idő</th>"
            + "<th>Hely</th><th>Anyja neve</th><th>Cím</th><th>Telefon</th>"
            + "<th>email</th><th>&nbsp;</th><th>&nbsp;</th><th>&nbsp;</th></tr>";
        json.forEach(j => {
            tabla.innerHTML += "<tr><td>" + j.jnev + "</td><td>" + j.szulnev + "</td>"
                + "<td>" + j.szulido + "</td><td>" + j.szulhely + "</td>"
                + "<td>" + j.anyjaneve + "</td><td>" + j.cim + "</td>"
                + "<td>" + j.telefon + "</td><td>" + j.email + "</td>"
                + '<td><button class="button btn-sm btn-primary" onclick="modosit('
                + j.jid + ')">Módosítás</button></td>'
                + '<td><button class="button btn-sm btn-outline-danger" onclick="torol('
                + j.jid + ')">Törlés</button></td>'
                + "</tr>"
        });
        letszam = json.length;
        document.getElementById("letszam").innerHTML = " Létszám: " + letszam + " fő";
    } catch (err) {
        console.error("Hiba a jelentkezők betöltésekor:", err);
        tabla.innerHTML = '<tr><td colspan="11" class="text-danger">Hiba történt a jelentkezők betöltése közben. Kérjük, próbálja újra később.</td></tr>';
        alert(`Hiba: ${err.message}`);
    }
}

document.getElementById("hozzaad").onclick = async function (e) {
    const url = 'http://localhost:5000/public/jelentkezok';
    const payload = {
        "csid": Number(csid),
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
            throw new Error(response.status + ' ' + data.message);
        }
        document.querySelector("form").reset();
        jelentkezok();
    } catch (err) {
        console.error("Hiba a jelentkező hozzáadásakor:", err);
        alert(`Hiba: ${err.message}`);
    }
}

function modosit(jid) {
    sessionStorage.jid = jid
    window.location.href = "jmodosit.html"
}

async function torol(jid) {
    if (confirm("Biztosan törölni szeretnéd ezt a jelentkezőt?")) {
        try {
            const response = await fetch('http://localhost:5000/admin/jelentkezok/' + jid, {
                method: 'DELETE',
                headers: {
                    'Authorization': token
                }
            });
            jelentkezok();
        } catch (err) {
            console.log(err);
        }
    }
}

document.getElementById("vissza").onclick = function () {
    document.location.href = "csoportok.html"
}

document.getElementById("kijelentkezes").onclick = function () {
    delete sessionStorage.token
    document.location.replace("index.html")
}
