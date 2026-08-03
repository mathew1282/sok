// =====================================
// ZGŁOSZENIA
// =====================================

let zgloszeniaFilterLinia = "";
let zgloszeniaFilterOpis = "";
let zgloszeniaSortField = null;   // "Linia" lub "Opis"
let zgloszeniaSortAsc = true;

function initZgloszenia() {
    renderZgloszenia();
}

function renderZgloszenia() {
    const container = document.getElementById("zgloszeniaContainer");
    if (!container) return;

    // Filtrowanie
    let rows = appState.zgloszenia.rows.map((row, index) => ({ ...row, _index: index }));

    if (zgloszeniaFilterLinia) {
        const f = zgloszeniaFilterLinia.toLowerCase();
        rows = rows.filter(r => (r.Linia || "").toLowerCase().includes(f));
    }
    if (zgloszeniaFilterOpis) {
        const f = zgloszeniaFilterOpis.toLowerCase();
        rows = rows.filter(r => (r.Opis || "").toLowerCase().includes(f));
    }

    // Sortowanie
    if (zgloszeniaSortField) {
        rows.sort((a, b) => {
            const va = (a[zgloszeniaSortField] || "").toLowerCase();
            const vb = (b[zgloszeniaSortField] || "").toLowerCase();
            if (va < vb) return zgloszeniaSortAsc ? -1 : 1;
            if (va > vb) return zgloszeniaSortAsc ? 1 : -1;
            return 0;
        });
    }

    let html = `
    <div class="card">
        <h2>Zgłoszenia</h2>
        <br>
        <button class="btn-success" onclick="addZgloszenie()">Dodaj zgłoszenie</button>
        <br><br>

        <!-- Filtry -->
        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:15px; align-items:center;">
            <div>
                <label style="font-size:13px; color:#94a3b8;">Filtr Linia</label><br>
                <input type="text" id="zglFilterLinia" value="${zgloszeniaFilterLinia}" 
                       placeholder="Szukaj linii..." style="width:160px;"
                       oninput="zgloszeniaFilterLinia=this.value; renderZgloszenia();">
            </div>
            <div>
                <label style="font-size:13px; color:#94a3b8;">Filtr Opis</label><br>
                <input type="text" id="zglFilterOpis" value="${zgloszeniaFilterOpis}" 
                       placeholder="Szukaj opisu..." style="width:220px;"
                       oninput="zgloszeniaFilterOpis=this.value; renderZgloszenia();">
            </div>
            <div style="padding-top:18px;">
                <button class="btn-primary" onclick="sortZgloszenia('Linia')">Sortuj Linia</button>
                <button class="btn-primary" onclick="sortZgloszenia('Opis')">Sortuj Opis</button>
                <button class="btn-danger" onclick="clearZgloszeniaFilter()">Wyczyść filtry</button>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="cursor:pointer;" onclick="sortZgloszenia('Linia')">Linia ${zgloszeniaSortField==='Linia' ? (zgloszeniaSortAsc?'▲':'▼') : ''}</th>
                    <th style="cursor:pointer;" onclick="sortZgloszenia('Opis')">Opis ${zgloszeniaSortField==='Opis' ? (zgloszeniaSortAsc?'▲':'▼') : ''}</th>
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
                       onchange="updateZgloszenie(${index}, 'Linia', this.value)">
            </td>
            <td>
                <input type="text" value="${row.Opis || ''}" 
                       onchange="updateZgloszenie(${index}, 'Opis', this.value)">
            </td>
            <td>
                <button class="btn-danger" onclick="removeZgloszenie(${index})">Usuń</button>
            </td>
        </tr>`;
    });

    if (rows.length === 0) {
        html += `<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Brak wyników</td></tr>`;
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function sortZgloszenia(field) {
    if (zgloszeniaSortField === field) {
        zgloszeniaSortAsc = !zgloszeniaSortAsc;
    } else {
        zgloszeniaSortField = field;
        zgloszeniaSortAsc = true;
    }
    renderZgloszenia();
}

function clearZgloszeniaFilter() {
    zgloszeniaFilterLinia = "";
    zgloszeniaFilterOpis = "";
    zgloszeniaSortField = null;
    renderZgloszenia();
}

// =====================================
// FUNKCJE Z ASYNC SAVE
// =====================================

async function addZgloszenie() {
    appState.zgloszenia.rows.push({ Linia: "", Opis: "" });
    await saveState();
    renderZgloszenia();
}

async function removeZgloszenie(index) {
    if (!confirm("Usunąć zgłoszenie?")) return;
    appState.zgloszenia.rows.splice(index, 1);
    await saveState();
    renderZgloszenia();
}

async function updateZgloszenie(index, field, value) {
    appState.zgloszenia.rows[index][field] = value;
    await saveState();
}

// =====================================
// EXPOSE
// =====================================
window.addZgloszenie = addZgloszenie;
window.removeZgloszenie = removeZgloszenie;
window.updateZgloszenie = updateZgloszenie;
window.sortZgloszenia = sortZgloszenia;
window.clearZgloszeniaFilter = clearZgloszeniaFilter;
