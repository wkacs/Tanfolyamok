if (!sessionStorage.token) {
    document.location.replace("index.html")
}
const token = 'Bearer ' + sessionStorage.token;
const url = 'http://localhost:5000/admin/csoportok';

document.getElementById("datum").value = new Date().toISOString().slice(0, 10)
csoportok()

async function csoportok() {
    const tabla = document.getElementById("csoportok");
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
        tabla.innerHTML = `<tr><th>Azon</th><th>Képzés</th><th>Indulás</th><th>Beosztás</th><th>Helyszín</th>
                           <th>Ár (Ft)</th><th>Fő</th><th>&nbsp;</th><th>&nbsp;</th><th>&nbsp;</th></tr>`;
        json.forEach(cs => {
            tabla.innerHTML +=
                `<tr>
                    <td>${cs.csid}</td>
                    <td>${cs.knev}</td>
                    <td>${cs.indulas}</td>
                    <td>${cs.beosztas}</td>
                    <td>${cs.helyszin}</td>
                    <td>${cs.ar.toLocaleString()}</td>
                    <td>${cs.letszam}</td>
                    <td><button class="button btn-sm btn-primary" onclick="jelentkezok(${cs.csid})">Jelentkezők</button></td>
                    <td><button class="button btn-sm btn-primary" onclick="modosit(${cs.csid})">Módosítás</button></td>
                    <td><button class="button btn-sm btn-outline-danger" onclick="torol(${cs.csid})">Törlés</button></td>
                </tr>`;
        });
    } catch (err) {
        console.error("Hiba a csoportok lekérésekor:", err.message);
        tabla.innerHTML = `<tr><td colspan="10">Hiba történt a csoportok betöltésekor. Kérjük, próbálja újra később!</td></tr>`;
    }
}

document.getElementById("hozzaad").onclick = async function (e) {
    const payload = {
        "kid": document.getElementById("kepzes").value,
        "indulas": document.getElementById("datum").value,
        "beosztas": document.getElementById("beosztas").value,
        "helyszin": document.getElementById("helyszin").value,
        "ar": document.getElementById("ar").value
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json;charset=utf-8',
                'Authorization': token
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(response.status + ' ' + data.message);
        }
        document.querySelector("form").reset();
        csoportok();
    } catch (err) {
        console.error("Hiba a csoport hozzáadásakor:", err);
        alert(err.message);
    }
};

function jelentkezok(csid) {
    sessionStorage.csid = csid
    window.location.href = "jelentkezok.html"
}

function modosit(csid) {
    sessionStorage.csid = csid
    window.location.href = "modosit.html"
}

async function torol(csid) {
    const token = 'Bearer ' + sessionStorage.token;
    try {
        // 1. Ellenőrizzük, vannak-e jelentkezők a csoportban
        const listaUrl = `http://localhost:5000/admin/lista/${csid}`;
        const listaResponse = await fetch(listaUrl, {
            method: 'GET',
            headers: { 'Authorization': token }
        });
        if (!listaResponse.ok) {
            let errorMsg = `Hiba a jelentkezők listájának lekérésekor: ${listaResponse.status}`;
            throw new Error(errorMsg);
        }
        const jelentkezokLista = await listaResponse.json();
        if (jelentkezokLista.length > 0) {
            alert("Csak üres csoport törölhető!");
            return;
        }
        // 2. Ha a csoport üres, kérjünk megerősítést a törléshez
        if (confirm("Biztosan törölni szeretnéd ezt a csoportot?")) {
            const torlesUrl = `http://localhost:5000/admin/csoportok/${csid}`;
            const torlesResponse = await fetch(torlesUrl, {
                method: 'DELETE',
                headers: { 'Authorization': token }
            });
            if (!torlesResponse.ok) {
                let errorMsg = `Hiba a csoport törlésekor: ${torlesResponse.status}`;
                throw new Error(errorMsg);
            }
            csoportok();
        }
    } catch (err) {
        console.error("Hiba a törlés során:", err);
        alert(err.message);
    }
}

document.getElementById("kijelentkezes").onclick = function () {
    delete sessionStorage.token
    document.location.replace("index.html")
}
