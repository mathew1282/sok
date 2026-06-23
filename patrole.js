// =====================================
// PATROLE - DYŻURNI + WYBÓR LUDZI
// =====================================

let selectedPatrolMembers = [];
let selectedDyzurnyIndex = null;   // który dyżurny jest aktualnie wybrany

function initPatrole() {
    selectedPatrolMembers = [];
    selectedDyzurnyIndex = null;
    renderPatrole();
}

function renderPatrole() {
    const container = document.getElementById("patroleContainer");
    if (!container) return;

    const dyzurni = appState.dane.rows.filter(osoba => 
        osoba["Dyżurny"] && String(osoba["Dyżurny"]).trim() !== ""
    );

    let html = `
    <div class="card">
        <h2>Patrole</h2>
        <br>
        <h3>Dyżurni</h3>
        <div class="card-grid" style="margin-bottom:25px;">
    `;

    // Lista dyżurnych
    dyzurni.forEach((osoba, idx) => {
        const globalIndex = appState.dane.rows.indexOf(osoba);
        const isActive = selectedDyzurnyIndex === globalIndex ? "active" : "";
        html += `
        <div class="line-pill ${isActive}" onclick="selectDyzurny(${globalIndex})">
            ${getPersonName(osoba)}
        </div>`;
    });

    html += `</div>`;

    // Lista ludzi do wyboru (pojawia się po kliknięciu dyżurnego)
    if (selectedDyzurnyIndex !== null) {
        const pozostali = appState.dane.rows.filter((osoba, idx) => 
            idx !== selectedDyzurnyIndex && 
            !selectedPatrolMembers.includes(idx)
        );

        html += `<h3>Wybierz funkcjonariuszy do patrolu</h3><div class="card-grid">`;

        pozostali.forEach(osoba => {
            const idx = appState.dane.rows.indexOf(osoba);
            const selected = selectedPatrolMembers.includes(idx) ? "selected" : "";
            html += `
            <div class="item-card ${selected}" onclick="togglePatrolPerson(${idx})">
                ${getPersonName(osoba)}
            </div>`;
        });

        html += `</div>`;
    } else {
        html += `<p style="color:#94a3b8; font-style:italic;">Wybierz dyżurnego, aby dodać funkcjonariuszy...</p>`;
    }

    html += `
        <br><br>
        <label>Nazwa patrolu</label>
        <input type="text" id="patrolName">
        <br><br>
        <button class="btn-success" onclick="createPatrol()">Stwórz patrol</button>
    </div>

    <!-- Lista utworzonych patroli -->
    <div class="card">
        <h2>Lista patroli</h2>
        <br>
        <table>
            <thead>
                <tr>
                    <th>Nazwa</th>
                    <th>Skład</th>
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
            <td><button class="btn-primary" onclick="editPatrol(${index})">Edytuj</button></td>
            <td><button class="btn-danger" onclick="removePatrol(${index})">Usuń</button></td>
        </tr>`;
    });

    html += `</tbody></table></div>`;

    container.innerHTML = html;
}

// =====================================
// FUNKCJE
// =====================================

function getPersonName(osoba) {
    return `${osoba["Stopień"] || ""} ${osoba["Nazwisko"] || ""} ${osoba["Imię"] || ""}`.trim();
}

function selectDyzurny(index) {
    selectedDyzurnyIndex = index;
    // Automatycznie dodajemy dyżurnego do patrolu
    if (!selectedPatrolMembers.includes(index)) {
        selectedPatrolMembers.push(index);
    }
    renderPatrole();
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

async function createPatrol() {
    const nazwa = document.getElementById("patrolName").value.trim();
    if (!nazwa) {
        alert("Podaj nazwę patrolu");
        return;
    }
    if (selectedPatrolMembers.length === 0) {
        alert("Wybierz przynajmniej dyżurnego i funkcjonariuszy");
        return;
    }

    const sklad = selectedPatrolMembers.map(i => getPersonName(appState.dane.rows[i]));

    appState.patrole.push({
        nazwa,
        sklad,
        dyzurny: getPersonName(appState.dane.rows[selectedDyzurnyIndex])
    });

    await saveState();
    selectedPatrolMembers = [];
    selectedDyzurnyIndex = null;
    renderPatrole();
}

async function editPatrol(index) {
    // prosta edycja - można rozwinąć później
    const patrol = appState.patrole[index];
    const nowaNazwa = prompt("Nowa nazwa patrolu", patrol.nazwa);
    if (nowaNazwa) {
        patrol.nazwa = nowaNazwa;
        await saveState();
        renderPatrole();
    }
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
window.selectDyzurny = selectDyzurny;
window.togglePatrolPerson = togglePatrolPerson;
window.createPatrol = createPatrol;
window.editPatrol = editPatrol;
window.removePatrol = removePatrol;
