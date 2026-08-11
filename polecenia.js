// =====================================
// POLECENIA (Rodzaj + Nazwa + Km od/do + 3 poziomy)
// =====================================

let currentPolecenieEdit = null;
let poleceniaFilterLinia = "";

const RODZAJE_POLECEN = ["Szlak", "Stacja towarowa", "Stacja osobowa", "Inne"];

function initPolecenia() {
    if (appState.polecenia?.rows) {
        appState.polecenia.rows.forEach(row => {
            if (row.OpisKrotki === undefined) row.OpisKrotki = row.Opis || "";
            if (row.Opis === undefined) row.Opis = "";
            if (row.Linia === undefined) row.Linia = "";
            if (row.OpisPom === undefined) row.OpisPom = "";
            if (row.Rodzaj === undefined) row.Rodzaj = "Inne";
            if (row.Nazwa === undefined) row.Nazwa = row.NazwaSzlaku || "";
            if (row.KmOd === undefined) row.KmOd = row.Km || "";
            if (row.KmDo === undefined) row.KmDo = "";
        });
    }
    if (appState.polecenia) {
        appState.polecenia.columns = ["Linia", "OpisKrotki", "OpisPom", "Opis", "Rodzaj", "Nazwa", "KmOd", "KmDo"];
    }
    renderPolecenia();
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

function renderPolecenia() {
    const container = document.getElementById("poleceniaContainer");
    if (!container) return;

    const allRows = appState.polecenia?.rows || [];
    let lines = [...new Set(allRows.map(r => r.Linia).filter(Boolean))];
    lines = sortLinesNatural(lines);

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));
    if (poleceniaFilterLinia) {
        rows = rows.filter(r => r.Linia === poleceniaFilterLinia);
    }

    let html = `
    <div class="card">
        <h2>Polecenia</h2>
        <br>
        <button class="btn-success" onclick="openPolecenieModal()">Dodaj polecenie</button>
        <br><br>

        <div style="margin-bottom:15px;">
            <div style="font-size:14px; color:#94a3b8; margin-bottom:8px;">Filtr linii (kliknij):</div>
            <div class="card-grid">
                <div class="line-pill ${poleceniaFilterLinia === "" ? "active" : ""}"
                     onclick="setPoleceniaFilterLinia('')">Wszystkie</div>
    `;

    lines.forEach(line => {
        const active = poleceniaFilterLinia === line ? "active" : "";
        html += `
            <div class="line-pill ${active}" onclick="setPoleceniaFilterLinia('${String(line).replace(/'/g, "\\'")}')">
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
                    <th>Rodzaj</th>
                    <th>Nazwa</th>
                    <th>Km od</th>
                    <th>Km do</th>
                    <th>Akcje</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach(row => {
        const index = row._index;
        const krotki = (row.OpisKrotki || "").substring(0, 50);
        const pom = (row.OpisPom || "").substring(0, 50);
        const opis = (row.Opis || "").substring(0, 60);

        html += `
        <tr>
            <td>${escapeHtml(row.Linia || "")}</td>
            <td>${escapeHtml(krotki)}</td>
            <td>${escapeHtml(pom)}</td>
            <td style="white-space: pre-wrap; max-width: 220px;">${escapeHtml(opis)}${(row.Opis || "").length > 60 ? "…" : ""}</td>
            <td>${escapeHtml(row.Rodzaj || "Inne")}</td>
            <td>${escapeHtml(row.Nazwa || "")}</td>
            <td>${escapeHtml(row.KmOd || "")}</td>
            <td>${escapeHtml(row.KmDo || "")}</td>
            <td style="white-space:nowrap;">
                <button class="btn-primary" onclick="editPolecenie(${index})">Edytuj</button>
                <button class="btn-danger" onclick="removePolecenie(${index})">Usuń</button>
            </td>
        </tr>`;
    });

    if (rows.length === 0) {
        html += `<tr><td colspan="9" style="text-align:center; color:#94a3b8;">Brak poleceń</td></tr>`;
    }

    html += `
            </tbody>
        </table>
    </div>

    <div id="polecenieModal" class="modal-overlay" style="display:none;">
        <div class="modal">
            <h2 id="polecenieModalTitle">Polecenie</h2>

            <label>Nr linii</label>
            <input type="text" id="polecenieLinia" placeholder="np. 275, 1, Legnica">

            <br><br>
            <label>Opis krótki (2. poziom w Generatorze)</label>
            <input type="text" id="polecenieOpisKrotki" placeholder="Krótka nazwa">

            <br><br>
            <label>Opis pom (3. poziom w Generatorze)</label>
            <input type="text" id="polecenieOpisPom" placeholder="Opis pomocniczy">

            <br><br>
            <label>Opis (tekst generowany do wpisu)</label>
            <textarea id="polecenieOpis" rows="8" style="width:100%; font-family: monospace;" placeholder="Pełny opis z znacznikami..."></textarea>

            <br><br>
            <label>Rodzaj</label>
            <select id="polecenieRodzaj" style="width:100%; padding:8px; border-radius:8px;">
                <option value="Inne">Inne (nie idzie do statystyk sprawdzeń)</option>
                <option value="Szlak">Szlak</option>
                <option value="Stacja towarowa">Stacja towarowa</option>
                <option value="Stacja osobowa">Stacja osobowa</option>
            </select>

            <br><br>
            <label>Nazwa (szlaku lub stacji)</label>
            <input type="text" id="polecenieNazwa" placeholder="np. Legnica–Wrocław lub Legnica">

            <br><br>
            <label>Km od</label>
            <input type="text" id="polecenieKmOd" placeholder="np. 12,450">

            <br><br>
            <label>Km do</label>
            <input type="text" id="polecenieKmDo" placeholder="np. 18,200">

            <br><br>
            <h3>Dostępne znaczniki</h3>
            <div class="tag-buttons">
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@patrol')">@patrol</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@dowodca')">@dowodca</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@kierowca')">@kierowca</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@sklad')">@sklad</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@wszyscy')">@wszyscy</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@zgloszenia')">@zgloszenia</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@polecenia')">@polecenia</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@KZ')">@KZ</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@MKK')">@MKK</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@data')">@data</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@godzina')">@godzina</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@wot')">@wot</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@policjant')">@policjant</button>
                <button type="button" class="btn-primary" onclick="insertPolecenieTag('@wybrani')">@wybrani</button>
            </div>

            <div class="modal-actions">
                <button class="btn-success" onclick="savePolecenie()">Zapisz polecenie</button>
                <button class="btn-danger" onclick="closePolecenieModal()">Anuluj</button>
            </div>
        </div>
    </div>
    `;

    container.innerHTML = html;
}

function setPoleceniaFilterLinia(line) {
    poleceniaFilterLinia = line || "";
    renderPolecenia();
}

function openPolecenieModal() {
    currentPolecenieEdit = null;
    document.getElementById("polecenieModalTitle").innerText = "Dodaj polecenie";
    document.getElementById("polecenieLinia").value = poleceniaFilterLinia || "";
    document.getElementById("polecenieOpisKrotki").value = "";
    document.getElementById("polecenieOpisPom").value = "";
    document.getElementById("polecenieOpis").value = "";
    document.getElementById("polecenieRodzaj").value = "Inne";
    document.getElementById("polecenieNazwa").value = "";
    document.getElementById("polecenieKmOd").value = "";
    document.getElementById("polecenieKmDo").value = "";
    document.getElementById("polecenieModal").style.display = "flex";
}

function closePolecenieModal() {
    document.getElementById("polecenieModal").style.display = "none";
    currentPolecenieEdit = null;
}

async function savePolecenie() {
    const linia = document.getElementById("polecenieLinia").value.trim();
    const opisKrotki = document.getElementById("polecenieOpisKrotki").value.trim();
    const opisPom = document.getElementById("polecenieOpisPom").value.trim();
    const opis = document.getElementById("polecenieOpis").value.trim();
    const rodzaj = document.getElementById("polecenieRodzaj").value || "Inne";
    const nazwa = document.getElementById("polecenieNazwa").value.trim();
    const kmOd = document.getElementById("polecenieKmOd").value.trim();
    const kmDo = document.getElementById("polecenieKmDo").value.trim();

    if (!linia) { alert("Podaj nr linii"); return; }
    if (!opisKrotki) { alert("Podaj opis krótki"); return; }

    const item = {
        Linia: linia,
        OpisKrotki: opisKrotki,
        OpisPom: opisPom,
        Opis: opis,
        Rodzaj: rodzaj,
        Nazwa: nazwa,
        KmOd: kmOd,
        KmDo: kmDo
    };

    if (!appState.polecenia) {
        appState.polecenia = { columns: ["Linia", "OpisKrotki", "OpisPom", "Opis", "Rodzaj", "Nazwa", "KmOd", "KmDo"], rows: [] };
    }
    if (!Array.isArray(appState.polecenia.rows)) appState.polecenia.rows = [];

    if (currentPolecenieEdit === null) {
        appState.polecenia.rows.push(item);
    } else {
        appState.polecenia.rows[currentPolecenieEdit] = item;
    }

    await saveState();
    closePolecenieModal();
    renderPolecenia();
}

async function editPolecenie(index) {
    currentPolecenieEdit = index;
    const row = appState.polecenia.rows[index];
    if (!row) return;

    document.getElementById("polecenieModalTitle").innerText = "Edytuj polecenie";
    document.getElementById("polecenieLinia").value = row.Linia || "";
    document.getElementById("polecenieOpisKrotki").value = row.OpisKrotki || "";
    document.getElementById("polecenieOpisPom").value = row.OpisPom || "";
    document.getElementById("polecenieOpis").value = row.Opis || "";
    document.getElementById("polecenieRodzaj").value = row.Rodzaj || "Inne";
    document.getElementById("polecenieNazwa").value = row.Nazwa || row.NazwaSzlaku || "";
    document.getElementById("polecenieKmOd").value = row.KmOd || row.Km || "";
    document.getElementById("polecenieKmDo").value = row.KmDo || "";
    document.getElementById("polecenieModal").style.display = "flex";
}

async function removePolecenie(index) {
    if (!confirm("Usunąć polecenie?")) return;
    appState.polecenia.rows.splice(index, 1);
    await saveState();
    renderPolecenia();
}

function insertPolecenieTag(tag) {
    const textarea = document.getElementById("polecenieOpis");
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + tag + text.substring(end);
    textarea.focus();
    textarea.selectionStart = start + tag.length;
    textarea.selectionEnd = start + tag.length;
}

window.openPolecenieModal = openPolecenieModal;
window.closePolecenieModal = closePolecenieModal;
window.savePolecenie = savePolecenie;
window.editPolecenie = editPolecenie;
window.removePolecenie = removePolecenie;
window.insertPolecenieTag = insertPolecenieTag;
window.setPoleceniaFilterLinia = setPoleceniaFilterLinia;
