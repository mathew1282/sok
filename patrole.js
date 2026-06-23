// =====================================
// PATROLE
// =====================================

let selectedPatrolMembers = [];

function initPatrole() {
    selectedPatrolMembers = [];
    renderPatrole();
}

// =====================================
// RENDER
// =====================================

function renderPatrole() {
    const container = document.getElementById("patroleContainer");
    if (!container) return;

    const funkcjonariusze = [...appState.dane.rows]
        .sort((a, b) => (a["Nazwisko"] || "").localeCompare(b["Nazwisko"] || "", "pl"));

    let html = `
    <div class="card">
        <h2>Patrole</h2>
        <br>
        <h3>Wybierz ludzi</h3>
        <br>
        <div class="card-grid">
    `;

    funkcjonariusze.forEach(osoba => {
        const nazwa = getPersonName(osoba);
        const originalIndex = appState.dane.rows.indexOf(osoba);
        const selected = selectedPatrolMembers.includes(originalIndex) ? "selected" : "";

        html += `
        <div class="item-card ${selected}" onclick="togglePatrolPerson(${originalIndex})">
            ${nazwa}
        </div>`;
    });

    html += `
        </div>
        <br><br>
        <label>Nazwa patrolu</label>
        <input type="text" id="patrolName">
        <br><br>
        <label>Dowódca</label>
        <select id="dowodcaSelect"><option value="">-- brak --</option></select>
        <br><br>
        <label>Kierowca</label>
        <select id="kierowcaSelect"><option value="">-- brak --</option></select>
        <br><br>
        <button class="btn-success" onclick="createPatrol()">Stwórz patrol</button>
    </div>

    <div class="card">
        <h2>Lista patroli</h2>
        <br>
        <table>
            <thead>
                <tr>
                    <th>Nazwa</th>
                    <th>Skład</th>
                    <th>Dowódca</th>
                    <th>Kierowca</th>
                    <th>Edytuj</th>
                    <th>Usuń</th>
                </tr>
            </thead>
            <tbody>
    `;

    appState.patrole.forEach((patrol, index) => {
        html += `
        <tr>
            <td>${patrol.nazwa}</td>
            <td>${patrol.sklad.join("<br>")}</td>
            <td>${patrol.dowodca || ""}</td>
            <td>${patrol.kierowca || ""}</td>
            <td><button class="btn-primary" onclick="editPatrol(${index})">Edytuj</button></td>
            <td><button class="btn-danger" onclick="removePatrol(${index})">Usuń</button></td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;

    updatePatrolLists();
}

// =====================================
// POMOCNICZE
// =====================================

function getPersonName(osoba) {
    return `${osoba["Stopień"] || ""} ${osoba["Nazwisko"] || ""} ${osoba["Imię"] || ""}`.trim();
}

function togglePatrolPerson(index) {
    const pos = selectedPatrolMembers.indexOf(index);
    if (pos > -1) {
        selectedPatrolMembers.splice(pos, 1);
    } else {
        selectedPatrolMembers.push(index);
    }
    renderPatrole();
}

function updatePatrolLists() {
    const dowodca = document.getElementById("dowodcaSelect");
    const kierowca = document.getElementById("kierowcaSelect");
    if (!dowodca || !kierowca) return;

    let options = `<option value="">-- brak --</option>`;

    selectedPatrolMembers.forEach(index => {
        const osoba = appState.dane.rows[index];
        const nazwa = getPersonName(osoba);
        options += `<option value="${nazwa}">${nazwa}</option>`;
    });

    dowodca.innerHTML = options;
    kierowca.innerHTML = options;
}

// =====================================
// TWORZENIE / EDYCJA / USUWANIE
// =====================================

async function createPatrol() {
    const nazwa = document.getElementById("patrolName").value.trim();
    if (!nazwa) {
        alert("Podaj nazwę patrolu");
        return;
    }
    if (selectedPatrolMembers.length === 0) {
        alert("Wybierz funkcjonariuszy");
        return;
    }

    const sklad = selectedPatrolMembers.map(index => getPersonName(appState.dane.rows[index]));
    const dowodca = document.getElementById("dowodcaSelect").value;
    const kierowca = document.getElementById("kierowcaSelect").value;

    appState.patrole.push({ nazwa, sklad, dowodca, kierowca });

    await saveState();
    selectedPatrolMembers = [];
    renderPatrole();
}

async function editPatrol(index) {
    const patrol = appState.patrole[index];
    const nowaNazwa = prompt("Nazwa patrolu", patrol.nazwa);
    if (nowaNazwa === null) return;

    const nowyDowodca = prompt("Dowódca", patrol.dowodca || "");
    if (nowyDowodca === null) return;

    const nowyKierowca = prompt("Kierowca", patrol.kierowca || "");
    if (nowyKierowca === null) return;

    patrol.nazwa = nowaNazwa;
    patrol.dowodca = nowyDowodca;
    patrol.kierowca = nowyKierowca;

    await saveState();
    renderPatrole();
}

async function removePatrol(index) {
    if (!confirm("Usunąć patrol?")) return;
    appState.patrole.splice(index, 1);
    await saveState();
    renderPatrole();
}

// =====================================
// EXPOSE
// =====================================
window.togglePatrolPerson = togglePatrolPerson;
window.createPatrol = createPatrol;
window.editPatrol = editPatrol;
window.removePatrol = removePatrol;
