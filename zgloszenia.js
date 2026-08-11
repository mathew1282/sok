// =====================================
// ZGŁOSZENIA (6 kolumn + 3 poziomy w generatorze)
// =====================================

let currentZgloszenieEdit = null;
let zgloszeniaFilterLinia = "";

function initZgloszenia() {
    // migracja starych danych
    if (appState.zgloszenia?.rows) {
        appState.zgloszenia.rows.forEach(row => {
            if (row.OpisKrotki === undefined) row.OpisKrotki = row.Opis || "";
            if (row.Opis === undefined) row.Opis = "";
            if (row.Linia === undefined) row.Linia = "";
            if (row.OpisPom === undefined) row.OpisPom = "";
            if (row.NazwaSzlaku === undefined) row.NazwaSzlaku = "";
            if (row.Km === undefined) row.Km = "";
        });
    }
    if (appState.zgloszenia) {
        appState.zgloszenia.columns = ["Linia", "OpisKrotki", "OpisPom", "Opis", "NazwaSzlaku", "Km"];
    }
    renderZgloszenia();
}

function sortLinesNatural(lines) {
    return [...lines].sort((a, b) => {
        const aStr = String(a || "").trim();
        const bStr = String(b || "").trim();
        const aIsNum = /^\d/.test(aStr);
        const bIsNum = /^\d/.test(bStr);
        if (aIsNum && !bIsNum) return -1;
        if (!aIsNum && bIsNum) return 1;
        if (aIsNum && bIsNum) {
            const aNum = parseInt(aStr, 10);
            const bNum = parseInt(bStr, 10);
            if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) return aNum - bNum;
        }
        return aStr.localeCompare(bStr, "pl", { numeric: true, sensitivity: "base" });
    });
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function renderZgloszenia() {
    const container = document.getElementById("zgloszeniaContainer");
    if (!container) return;

    const allRows = appState.zgloszenia?.rows || [];
    let lines = [...new Set(allRows.map(r => r.Linia).filter(Boolean))];
    lines = sortLinesNatural(lines);

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));
    if (zgloszeniaFilterLinia) {
        rows = rows.filter(r => r.Linia === zgloszeniaFilterLinia);
    }

    let html = `
    <div class="card">
        <h2>Zgłoszenia</h2>
        <br>
        <button class="btn-success" onclick="openZgloszenieModal()">Dodaj zgłoszenie</button>
        <br><br>

        <div style="margin-bottom:15px;">
            <div style="font-size:14px; color:#94a3b8; margin-bottom:8px;">Filtr linii (kliknij):</div>
            <div class="card-grid">
                <div class="line-pill ${zgloszeniaFilterLinia === "" ? "active" : ""}"
                     onclick="setZgloszeniaFilterLinia('')">Wszystkie</div>
    `;

    lines.forEach(line => {
        const active = zgloszeniaFilterLinia === line ? "active" : "";
        html += `
            <div class="line-pill ${active}" onclick="setZgloszeniaFilterLinia('${String(line).replace(/'/g, "\\'")}')">
                ${escapeHtml(line)}
            </div>`;
    });

    html += `
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Nr linii</th>
                    <th>Opis krótki</th>
                    <th>Opis pom</th>
                    <th>Opis</th>
                    <th>Nazwa szlaku</th>
                    <th>Km</th>
                    <th>Akcje</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach(row => {
        const index = row._index;
        const krotki = (row.OpisKrotki || "").substring(0, 60);
        const pom = (row.OpisPom || "").substring(0, 60);
        const opis = (row.Opis || "").substring(0, 80);

        html += `
        <tr>
            <td>${escapeHtml(row.Linia || "")}</td>
            <td>${escapeHtml(krotki)}</td>
            <td>${escapeHtml(pom)}</td>
            <td style="white-space: pre-wrap; max-width: 280px;">${escapeHtml(opis)}${(row.Opis || "").length > 80 ? "…" : ""}</td>
            <td>${escapeHtml(row.NazwaSzlaku || "")}</td>
            <td>${escapeHtml(row.Km || "")}</td>
            <td style="white-space:nowrap;">
                <button class="btn-primary" onclick="editZgloszenie(${index})">Edytuj</button>
                <button class="btn-danger" onclick="removeZgloszenie(${index})">Usuń</button>
            </td>
        </tr>`;
    });

    if (rows.length === 0) {
        html += `<tr><td colspan="7" style="text-align:center; color:#94a3b8;">Brak zgłoszeń</td></tr>`;
    }

    html += `
            </tbody>
        </table>
    </div>

    <!-- MODAL -->
    <div id="zgloszenieModal" class="modal-overlay" style="display:none;">
        <div class="modal">
            <h2 id="zgloszenieModalTitle">Zgłoszenie</h2>

            <label>Nr linii</label>
            <input type="text" id="zgloszenieLinia" placeholder="np. 275, 1, Legnica">

            <br><br>
            <label>Opis krótki (2. poziom w Generatorze)</label>
            <input type="text" id="zgloszenieOpisKrotki" placeholder="Krótka nazwa">

            <br><br>
            <label>Opis pom (3. poziom w Generatorze)</label>
            <input type="text" id="zgloszenieOpisPom" placeholder="Opis pomocniczy">

            <br><br>
            <label>Opis (tekst generowany do wpisu)</label>
            <textarea id="zgloszenieOpis" rows="8" style="width:100%; font-family: monospace;" placeholder="Pełny opis z znacznikami..."></textarea>

            <br><br>
            <label>Nazwa szlaku</label>
            <input type="text" id="zgloszenieNazwaSzlaku" placeholder="Nazwa szlaku">

            <br><br>
            <label>Km</label>
            <input type="text" id="zgloszenieKm" placeholder="np. 12,450">

            <br><br>
            <h3>Dostępne znaczniki</h3>
            <div class="tag-buttons">
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@patrol')">@patrol</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@dowodca')">@dowodca</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@kierowca')">@kierowca</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@sklad')">@sklad</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@wszyscy')">@wszyscy</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@zgloszenia')">@zgloszenia</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@polecenia')">@polecenia</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@KZ')">@KZ</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@MKK')">@MKK</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@data')">@data</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@godzina')">@godzina</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@wot')">@wot</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@policjant')">@policjant</button>
                <button type="button" class="btn-primary" onclick="insertZgloszenieTag('@wybrani')">@wybrani</button>
            </div>

            <div class="modal-actions">
                <button class="btn-success" onclick="saveZgloszenie()">Zapisz zgłoszenie</button>
                <button class="btn-danger" onclick="closeZgloszenieModal()">Anuluj</button>
            </div>
        </div>
    </div>
    `;

    container.innerHTML = html;
}

function setZgloszeniaFilterLinia(line) {
    zgloszeniaFilterLinia = line || "";
    renderZgloszenia();
}

function openZgloszenieModal() {
    currentZgloszenieEdit = null;
    document.getElementById("zgloszenieModalTitle").innerText = "Dodaj zgłoszenie";
    document.getElementById("zgloszenieLinia").value = zgloszeniaFilterLinia || "";
    document.getElementById("zgloszenieOpisKrotki").value = "";
    document.getElementById("zgloszenieOpisPom").value = "";
    document.getElementById("zgloszenieOpis").value = "";
    document.getElementById("zgloszenieNazwaSzlaku").value = "";
    document.getElementById("zgloszenieKm").value = "";
    document.getElementById("zgloszenieModal").style.display = "flex";
}

function closeZgloszenieModal() {
    document.getElementById("zgloszenieModal").style.display = "none";
    currentZgloszenieEdit = null;
}

async function saveZgloszenie() {
    const linia = document.getElementById("zgloszenieLinia").value.trim();
    const opisKrotki = document.getElementById("zgloszenieOpisKrotki").value.trim();
    const opisPom = document.getElementById("zgloszenieOpisPom").value.trim();
    const opis = document.getElementById("zgloszenieOpis").value.trim();
    const nazwaSzlaku = document.getElementById("zgloszenieNazwaSzlaku").value.trim();
    const km = document.getElementById("zgloszenieKm").value.trim();

    if (!linia) { alert("Podaj nr linii"); return; }
    if (!opisKrotki) { alert("Podaj opis krótki"); return; }

    const item = {
        Linia: linia,
        OpisKrotki: opisKrotki,
        OpisPom: opisPom,
        Opis: opis,
        NazwaSzlaku: nazwaSzlaku,
        Km: km
    };

    if (!appState.zgloszenia) {
        appState.zgloszenia = { columns: ["Linia", "OpisKrotki", "OpisPom", "Opis", "NazwaSzlaku", "Km"], rows: [] };
    }
    if (!Array.isArray(appState.zgloszenia.rows)) appState.zgloszenia.rows = [];

    if (currentZgloszenieEdit === null) {
        appState.zgloszenia.rows.push(item);
    } else {
        appState.zgloszenia.rows[currentZgloszenieEdit] = item;
    }

    await saveState();
    closeZgloszenieModal();
    renderZgloszenia();
}

async function editZgloszenie(index) {
    currentZgloszenieEdit = index;
    const row = appState.zgloszenia.rows[index];
    if (!row) return;

    document.getElementById("zgloszenieModalTitle").innerText = "Edytuj zgłoszenie";
    document.getElementById("zgloszenieLinia").value = row.Linia || "";
    document.getElementById("zgloszenieOpisKrotki").value = row.OpisKrotki || "";
    document.getElementById("zgloszenieOpisPom").value = row.OpisPom || "";
    document.getElementById("zgloszenieOpis").value = row.Opis || "";
    document.getElementById("zgloszenieNazwaSzlaku").value = row.NazwaSzlaku || "";
    document.getElementById("zgloszenieKm").value = row.Km || "";
    document.getElementById("zgloszenieModal").style.display = "flex";
}

async function removeZgloszenie(index) {
    if (!confirm("Usunąć zgłoszenie?")) return;
    appState.zgloszenia.rows.splice(index, 1);
    await saveState();
    renderZgloszenia();
}

function insertZgloszenieTag(tag) {
    const textarea = document.getElementById("zgloszenieOpis");
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + tag + text.substring(end);
    textarea.focus();
    textarea.selectionStart = start + tag.length;
    textarea.selectionEnd = start + tag.length;
}

window.openZgloszenieModal = openZgloszenieModal;
window.closeZgloszenieModal = closeZgloszenieModal;
window.saveZgloszenie = saveZgloszenie;
window.editZgloszenie = editZgloszenie;
window.removeZgloszenie = removeZgloszenie;
window.insertZgloszenieTag = insertZgloszenieTag;
window.setZgloszeniaFilterLinia = setZgloszeniaFilterLinia;
