// =====================================
// POLECENIA
// =====================================

let poleceniaFilterLinia = "";
let poleceniaFilterOpis = "";
let poleceniaSortField = null;
let poleceniaSortAsc = true;

function initPolecenia() {
    renderPolecenia();
}

function renderPolecenia() {
    const container = document.getElementById("poleceniaContainer");
    if (!container) return;

    let rows = appState.polecenia.rows.map((row, index) => ({ ...row, _index: index }));

    if (poleceniaFilterLinia) {
        const f = poleceniaFilterLinia.toLowerCase();
        rows = rows.filter(r => (r.Linia || "").toLowerCase().includes(f));
    }
    if (poleceniaFilterOpis) {
        const f = poleceniaFilterOpis.toLowerCase();
        rows = rows.filter(r => (r.Opis || "").toLowerCase().includes(f));
    }

    if (poleceniaSortField) {
        rows.sort((a, b) => {
            const va = (a[poleceniaSortField] || "").toLowerCase();
            const vb = (b[poleceniaSortField] || "").toLowerCase();
            if (va < vb) return poleceniaSortAsc ? -1 : 1;
            if (va > vb) return poleceniaSortAsc ? 1 : -1;
            return 0;
        });
    }

    let html = `
    <div class="card">
        <h2>Polecenia</h2>
        <br>
        <button class="btn-success" onclick="addPolecenie()">Dodaj polecenie</button>
        <br><br>

        <!-- Filtry -->
        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:15px; align-items:center;">
            <div>
                <label style="font-size:13px; color:#94a3b8;">Filtr Linia</label><br>
                <input type="text" id="polFilterLinia" value="${poleceniaFilterLinia}" 
                       placeholder="Szukaj linii..." style="width:160px;"
                       oninput="poleceniaFilterLinia=this.value; renderPolecenia();">
            </div>
            <div>
                <label style="font-size:13px; color:#94a3b8;">Filtr Opis</label><br>
                <input type="text" id="polFilterOpis" value="${poleceniaFilterOpis}" 
                       placeholder="Szukaj opisu..." style="width:220px;"
                       oninput="poleceniaFilterOpis=this.value; renderPolecenia();">
            </div>
            <div style="padding-top:18px;">
                <button class="btn-primary" onclick="sortPolecenia('Linia')">Sortuj Linia</button>
                <button class="btn-primary" onclick="sortPolecenia('Opis')">Sortuj Opis</button>
                <button class="btn-danger" onclick="clearPoleceniaFilter()">Wyczyść filtry</button>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="cursor:pointer;" onclick="sortPolecenia('Linia')">Linia ${poleceniaSortField==='Linia' ? (poleceniaSortAsc?'▲':'▼') : ''}</th>
                    <th style="cursor:pointer;" onclick="sortPolecenia('Opis')">Opis ${poleceniaSortField==='Opis' ? (poleceniaSortAsc?'▲':'▼') : ''}</th>
                    <th>Akcje</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach(row => {
        const index = row._index;
        html += `
        <tr>
            <td>
                <input type="text" value="${row.Linia || ''}" 
                       onchange="updatePolecenie(${index}, 'Linia', this.value)">
            </td>
            <td>
                <input type="text" value="${row.Opis || ''}" 
                       onchange="updatePolecenie(${index}, 'Opis', this.value)">
            </td>
            <td>
                <button class="btn-danger" onclick="removePolecenie(${index})">Usuń</button>
            </td>
        </tr>`;
    });

    if (rows.length === 0) {
        html += `<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Brak wyników</td></tr>`;
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function sortPolecenia(field) {
    if (poleceniaSortField === field) {
        poleceniaSortAsc = !poleceniaSortAsc;
    } else {
        poleceniaSortField = field;
        poleceniaSortAsc = true;
    }
    renderPolecenia();
}

function clearPoleceniaFilter() {
    poleceniaFilterLinia = "";
    poleceniaFilterOpis = "";
    poleceniaSortField = null;
    renderPolecenia();
}

// =====================================
// FUNKCJE Z ASYNC SAVE
// =====================================

async function addPolecenie() {
    appState.polecenia.rows.push({ Linia: "", Opis: "" });
    await saveState();
    renderPolecenia();
}

async function removePolecenie(index) {
    if (!confirm("Usunąć polecenie?")) return;
    appState.polecenia.rows.splice(index, 1);
    await saveState();
    renderPolecenia();
}

async function updatePolecenie(index, field, value) {
    appState.polecenia.rows[index][field] = value;
    await saveState();
}

// =====================================
// EXPOSE
// =====================================
window.addPolecenie = addPolecenie;
window.removePolecenie = removePolecenie;
window.updatePolecenie = updatePolecenie;
window.sortPolecenia = sortPolecenia;
window.clearPoleceniaFilter = clearPoleceniaFilter;
