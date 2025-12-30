if (!sessionStorage.token) {
    document.location.replace("index.html")
}
const token = 'Bearer ' + sessionStorage.token
const jid = sessionStorage.jid
const url = 'http://localhost:5000/admin/jelentkezok/' + jid;
document.getElementById("jid").innerHTML = jid
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
            throw new Error(`${response.status} ${json.message}`);
        }
        document.getElementById("jnev").value = json.jnev;
        document.getElementById("szulnev").value = json.szulnev || '';
        document.getElementById("szulido").value = json.szulido;
        document.getElementById("szulhely").value = json.szulhely;
        document.getElementById("anyjaneve").value = json.anyjaneve;
        document.getElementById("cim").value = json.cim;
        document.getElementById("telefon").value = json.telefon;
        document.getElementById("email").value = json.email;
    } catch (err) {
        console.error("Hiba a jelentkező adatainak betöltésekor:", err);
        alert(`Hiba történt a jelentkező adatainak betöltésekor: ${err.message}.`);
    }
}

document.getElementById("modosit").onclick = async function (e) {
    const payload = {
        "csid": Number(sessionStorage.csid),
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
            method: 'PUT',
            headers: {
                'Content-type': 'application/json;charset=utf-8',
                'Authorization': token
            },
            body: JSON.stringify(payload)
        });
        const responseData = await response.json();
        if (!response.ok) {
            alert(`Hiba a módosítás során: ${responseData.message || response.status}`);
            console.error("Szerverhiba a módosításkor:", response.status, responseData);
        } else {
            document.location.href = "jelentkezok.html"
        }
    } catch (err) {
        console.error("Hiba a jelentkező módosításakor (hálózati/kliens oldali):", err);
        alert(`Hiba történt a módosítás közben: ${err.message}. Kérjük, ellenőrizze a hálózati kapcsolatot.`);
    }
};

document.getElementById("vissza").onclick = function () {
    document.location.href = "jelentkezok.html"
}

document.getElementById("kijelentkezes").onclick = function () {
    delete sessionStorage.token
    document.location.replace("index.html")
}
