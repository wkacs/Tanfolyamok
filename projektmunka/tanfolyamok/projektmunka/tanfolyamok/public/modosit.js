if (!sessionStorage.token) {
    document.location.href = "index.html"
}
const token = 'Bearer ' + sessionStorage.token;
const csid = sessionStorage.csid
const url = `http://localhost:5000/admin/csoportok/${csid}`;
document.getElementById("csid").innerHTML = csid
betolt()

async function betolt() {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(response.status + ' ' + json.message);
        }
        document.getElementById("kepzes").selectedIndex = json.kid - 1;
        document.getElementById("datum").value = json.indulas;
        document.getElementById("beosztas").value = json.beosztas;
        document.getElementById("helyszin").value = json.helyszin;
        document.getElementById("ar").value = json.ar;
    } catch (err) {
        console.error("Hiba a csoportadatok betöltésekor:", err.message);
        alert(`Hiba a csoportadatok betöltésekor: ${err.message}. Kérjük, próbálja újra később.`);
    }
}

document.getElementById("modosit").onclick = async function (e) {
    const kidValue = document.getElementById("kepzes").value;
    const indulasValue = document.getElementById("datum").value;
    const beosztasValue = document.getElementById("beosztas").value.trim();
    const helyszinValue = document.getElementById("helyszin").value.trim();
    const arValue = document.getElementById("ar").value.trim();

    const payload = {
        "kid": parseInt(kidValue, 10),
        "indulas": indulasValue,
        "beosztas": beosztasValue,
        "helyszin": helyszinValue,
        "ar": arValue
    };

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json;charset=utf-8',
                'Authorization': token
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Szerverhiba: ${response.statusText}` }));
            throw new Error(errorData.message || `HTTP hiba! Státusz: ${response.status}`);
        }
        document.location.href = "csoportok.html";
    } catch (err) {
        console.error("Hiba a csoport módosításakor:", err.message);
        alert(`Hiba a csoport módosításakor: ${err.message}`);
    }
};

document.getElementById("vissza").onclick = function () {
    document.location.href = "csoportok.html"
}

document.getElementById("kijelentkezes").onclick = function () {
    delete sessionStorage.token
    document.location.replace("index.html")
}
