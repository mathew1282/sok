// =====================================
// ZGŁOSZENIA (jak szablony)
// =====================================

let currentZgloszenieEdit = null;

function initZgloszenia() {
    // migracja starych danych: Opis -> OpisKrotki + Opis
    if (appState.zgloszenia?.rows) {
        appState.zgloszenia.rows.forEach(row => {
            if (row.OpisKrotki === undefined) {
                row.OpisKrotki = row.Opis || "";
            }
            if (row.Opis === undefined) row.Opis = "";
            if (row.Linia === undefined) row.Linia = "";
        });
    }
    renderZgloszenia();
}

function renderZgloszenia() {
    const container = document.getElementById("zgloszeniaContainer");
    if (!container) return;

    const rows = appState.zgloszenia?.rows || [];

    let html = `
    <div class="card">
        <h2>Zgłoszenia</h2>
        <br>
        <button class="btn-success" onclick="openZgloszenieModal()">Dodaj zgłoszenie</button>
        <br><br>
        <table>
            <thead>
                <tr>
                    <th>Nr linii</th>
                    <th>Opis krótki</th>
                    <th>Opis</th>
                    <th>Akcje</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach((row, index) => {
        const krotki = (row.OpisKrotki || "").substring(0, 80);
        const opis = (row.Opis || "").substring(0, 120);

        html += `
        <tr>
            <td>${escapeHtml(row.Linia || "")}</td>
            <td>${escapeHtml(krotki)}</td>
            <td style="white-space: pre-wrap; max-width: 420px;">${escapeHtml(opis)}${(row.Opis || "").length > 120 ? "…" : ""}</td>
            <td style="white-space:nowrap;">
                <button class="btn-primary" onclick="editZgloszenie(${index})">Edytuj</button>
                <button class="btn-danger" onclick="removeZgloszenie(${index})">Usuń</button>
            </td>
        </tr>`;
    });

    if (rows.length === 0) {
        html += `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Brak zgłoszeń</td></tr>`;
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
            <label>Opis krótki (widoczny na kafelku w Generatorze)</label>
            <input type="text" id="zgloszenieOpisKrotki" placeholder="Krótka nazwa zgłoszenia">

            <br><br>
            <label>Opis (tekst generowany do wpisu)</label>
            <textarea id="zgloszenieOpis" rows="10" style="width:100%; font-family: monospace;" placeholder="Pełny opis z możliwością znaczników..."></textarea>

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

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function openZgloszenieModal() {
    currentZgloszenieEdit = null;
    document.getElementById("zgloszenieModalTitle").innerText = "Dodaj zgłoszenie";
    document.getElementById("zgloszenieLinia").value = "";
    document.getElementById("zgloszenieOpisKrotki").value = "";
    document.getElementById("zgloszenieOpis").value = "";
    document.getElementById("zgloszenieModal").style.display = "flex";
}

function closeZgloszenieModal() {
    document.getElementById("zgloszenieModal").style.display = "none";
    currentZgloszenieEdit = null;
}

async function saveZgloszenie() {
    const linia = document.getElementById("zgloszenieLinia").value.trim();
    const opisKrotki = document.getElementById("zgloszenieOpisKrotki").value.trim();
    const opis = document.getElementById("zgloszenieOpis").value.trim();

    if (!linia) {
        alert("Podaj nr linii");
        return;
    }
    if (!opisKrotki) {
        alert("Podaj opis krótki (będzie widoczny na kafelku)");
        return;
    }

    const item = {
        Linia: linia,
        OpisKrotki: opisKrotki,
        Opis: opis
    };

    if (!appState.zgloszenia) {
        appState.zgloszenia = { columns: ["Linia", "OpisKrotki", "Opis"], rows: [] };
    }
    if (!Array.isArray(appState.zgloszenia.rows)) {
        appState.zgloszenia.rows = [];
    }

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
    document.getElementById("zgloszenieOpisKrotki").value = row.OpisKrotki || row.Opis || "";
    document.getElementById("zgloszenieOpis").value = row.Opis || "";
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

// =====================================
// EXPOSE
// =====================================
window.openZgloszenieModal = openZgloszenieModal;
window.closeZgloszenieModal = closeZgloszenieModal;
window.saveZgloszenie = saveZgloszenie;
window.editZgloszenie = editZgloszenie;
window.removeZgloszenie = removeZgloszenie;
window.insertZgloszenieTag = insertZgloszenieTag;
