// =====================================
// POLECENIA (Rodzaj + Nazwa + Km od/do + 3 poziomy)
// =====================================

let currentPolecenieEdit = null;
let poleceniaFilterLinia = "";

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
                    <th>Opis krĂłtki</th>
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
            <td style="white-space: pre-wrap; max-width: 220px;">${escapeHtml(opis)}${(row.Opis || "").length > 60 ? "âŚ" : ""}</td>
            <td>${escapeHtml(row.Rodzaj || "Inne")}</td>
            <td>${escapeHtml(row.Nazwa || "")}</td>
            <td>${escapeHtml(row.KmOd || "")}</td>
            <td>${escapeHtml(row.KmDo || "")}</td>
            <td style="white-space:nowrap;">
                <button class="btn-primary" onclick="editPolecenie(${index})">Edytuj</button>
                <button class="btn-danger" onclick="removePolecenie(${index})">UsuĹ</button>
            </td>
        </tr>`;
    });

    if (rows.length === 0) {
        html += `<tr><td colspan="9" style="text-align:center; color:#94a3b8;">Brak poleceĹ</td></tr>`;
    }

    html += `
            </tbody>
        </table>
    </div>

    <div id="polecenieModal" class="modal-overlay" style="display:none;">
        <div class="modal" style="max-width:920px;">
            <h2 id="polecenieModalTitle">Polecenie</h2>

            <!-- RzÄd 1: Nr linii | Opis krĂłtki | Opis pom -->
            <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
                <div style="flex:1; min-width:140px;">
                    <label>Nr linii</label>
                    <input type="text" id="polecenieLinia" placeholder="np. 275" style="width:100%;">
                </div>
                <div style="flex:1; min-width:160px;">
                    <label>Opis krĂłtki</label>
                    <input type="text" id="polecenieOpisKrotki" placeholder="KrĂłtka nazwa" style="width:100%;">
                </div>
                <div style="flex:1; min-width:160px;">
                    <label>Opis pom</label>
                    <input type="text" id="polecenieOpisPom" placeholder="Opis pomocniczy" style="width:100%;">
                </div>
            </div>

            <!-- Opis â peĹna szerokoĹÄ + formatowanie -->
            <label>Opis (tekst generowany do wpisu)</label>
            <div style="display:flex; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                <button type="button" class="btn-primary" style="padding:4px 12px;" onclick="formatPolecenieOpis('bold')"><b>B</b> Pogrub</button>
                <button type="button" class="btn-primary" style="padding:4px 12px;" onclick="formatPolecenieOpis('underline')"><u>U</u> PodkreĹl</button>
            </div>
            <div id="polecenieOpis" class="rich-opis-editor" contenteditable="true"
                 style="width:100%; min-height:140px; padding:10px; font-family: monospace; margin-bottom:14px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#e2e8f0; white-space:pre-wrap; outline:none;"
                 data-placeholder="PeĹny opis z znacznikami..."></div>

            <!-- RzÄd 2: Rodzaj | Nazwa | Km od | Km do -->
            <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
                <div style="flex:1; min-width:150px;">
                    <label>Rodzaj</label>
                    <select id="polecenieRodzaj" style="width:100%; padding:8px; border-radius:8px;">
                        <option value="Inne">Inne (nie do statystyk)</option>
                        <option value="Szlak">Szlak</option>
                        <option value="Stacja towarowa">Stacja towarowa</option>
                        <option value="Stacja osobowa">Stacja osobowa</option>
                    </select>
                </div>
                <div style="flex:1.4; min-width:160px;">
                    <label>Nazwa (szlaku / stacji)</label>
                    <input type="text" id="polecenieNazwa" placeholder="np. Legnica" style="width:100%;">
                </div>
                <div style="flex:0.8; min-width:110px;">
                    <label>Km od</label>
                    <input type="text" id="polecenieKmOd" placeholder="12,450" style="width:100%;">
                </div>
                <div style="flex:0.8; min-width:110px;">
                    <label>Km do</label>
                    <input type="text" id="polecenieKmDo" placeholder="18,200" style="width:100%;">
                </div>
            </div>

            <h3>DostÄpne znaczniki</h3>
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
    const opisEl = document.getElementById("polecenieOpis");
    if (opisEl) opisEl.innerHTML = "";
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
    const opisEl = document.getElementById("polecenieOpis");
    const opis = opisEl ? (opisEl.innerHTML || "").trim() : "";
    const rodzaj = document.getElementById("polecenieRodzaj").value || "Inne";
    const nazwa = document.getElementById("polecenieNazwa").value.trim();
    const kmOd = document.getElementById("polecenieKmOd").value.trim();
    const kmDo = document.getElementById("polecenieKmDo").value.trim();

    if (!linia) { alert("Podaj nr linii"); return; }
    if (!opisKrotki) { alert("Podaj opis krĂłtki"); return; }

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
    const opisEl = document.getElementById("polecenieOpis");
    if (opisEl) {
        const raw = row.Opis || "";
        // JeĹli plain text z \n â pokaĹź z <br>, jeĹli HTML â wstaw jak jest
        if (/<(?:b|strong|u|i|br|div|p)\b/i.test(raw)) opisEl.innerHTML = raw;
        else opisEl.innerHTML = String(raw).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    }
    document.getElementById("polecenieRodzaj").value = row.Rodzaj || "Inne";
    document.getElementById("polecenieNazwa").value = row.Nazwa || row.NazwaSzlaku || "";
    document.getElementById("polecenieKmOd").value = row.KmOd || row.Km || "";
    document.getElementById("polecenieKmDo").value = row.KmDo || "";
    document.getElementById("polecenieModal").style.display = "flex";
}

async function removePolecenie(index) {
    if (!confirm("UsunÄÄ polecenie?")) return;
    appState.polecenia.rows.splice(index, 1);
    await saveState();
    renderPolecenia();
}

function insertPolecenieTag(tag) {
    const el = document.getElementById("polecenieOpis");
    if (!el) return;
    el.focus();
    try {
        document.execCommand("insertText", false, tag);
    } catch (e) {
        el.innerHTML += tag;
    }
}

function formatPolecenieOpis(cmd) {
    const el = document.getElementById("polecenieOpis");
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, null);
}

window.openPolecenieModal = openPolecenieModal;
window.closePolecenieModal = closePolecenieModal;
window.savePolecenie = savePolecenie;
window.editPolecenie = editPolecenie;
window.removePolecenie = removePolecenie;
window.insertPolecenieTag = insertPolecenieTag;
window.formatPolecenieOpis = formatPolecenieOpis;
window.setPoleceniaFilterLinia = setPoleceniaFilterLinia;            const bNum = parseInt(bStr, 10);
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
                    <th>Opis krĂłtki</th>
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
            <td style="white-space: pre-wrap; max-width: 220px;">${escapeHtml(opis)}${(row.Opis || "").length > 60 ? "âŚ" : ""}</td>
            <td>${escapeHtml(row.Rodzaj || "Inne")}</td>
            <td>${escapeHtml(row.Nazwa || "")}</td>
            <td>${escapeHtml(row.KmOd || "")}</td>
            <td>${escapeHtml(row.KmDo || "")}</td>
            <td style="white-space:nowrap;">
                <button class="btn-primary" onclick="editPolecenie(${index})">Edytuj</button>
                <button class="btn-danger" onclick="removePolecenie(${index})">UsuĹ</button>
            </td>
        </tr>`;
    });

    if (rows.length === 0) {
        html += `<tr><td colspan="9" style="text-align:center; color:#94a3b8;">Brak poleceĹ</td></tr>`;
    }

    html += `
            </tbody>
        </table>
    </div>

    <div id="polecenieModal" class="modal-overlay" style="display:none;">
        <div class="modal" style="max-width:920px;">
            <h2 id="polecenieModalTitle">Polecenie</h2>

            <!-- RzÄd 1: Nr linii | Opis krĂłtki | Opis pom -->
            <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
                <div style="flex:1; min-width:140px;">
                    <label>Nr linii</label>
                    <input type="text" id="polecenieLinia" placeholder="np. 275" style="width:100%;">
                </div>
                <div style="flex:1; min-width:160px;">
                    <label>Opis krĂłtki</label>
                    <input type="text" id="polecenieOpisKrotki" placeholder="KrĂłtka nazwa" style="width:100%;">
                </div>
                <div style="flex:1; min-width:160px;">
                    <label>Opis pom</label>
                    <input type="text" id="polecenieOpisPom" placeholder="Opis pomocniczy" style="width:100%;">
                </div>
            </div>

            <!-- Opis â peĹna szerokoĹÄ + formatowanie -->
            <label>Opis (tekst generowany do wpisu)</label>
            <div style="display:flex; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                <button type="button" class="btn-primary" style="padding:4px 12px;" onclick="formatPolecenieOpis('bold')"><b>B</b> Pogrub</button>
                <button type="button" class="btn-primary" style="padding:4px 12px;" onclick="formatPolecenieOpis('underline')"><u>U</u> PodkreĹl</button>
            </div>
            <div id="polecenieOpis" class="rich-opis-editor" contenteditable="true"
                 style="width:100%; min-height:140px; padding:10px; font-family: monospace; margin-bottom:14px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#e2e8f0; white-space:pre-wrap; outline:none;"
                 data-placeholder="PeĹny opis z znacznikami..."></div>

            <!-- RzÄd 2: Rodzaj | Nazwa | Km od | Km do -->
            <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
                <div style="flex:1; min-width:150px;">
                    <label>Rodzaj</label>
                    <select id="polecenieRodzaj" style="width:100%; padding:8px; border-radius:8px;">
                        <option value="Inne">Inne (nie do statystyk)</option>
                        <option value="Szlak">Szlak</option>
                        <option value="Stacja towarowa">Stacja towarowa</option>
                        <option value="Stacja osobowa">Stacja osobowa</option>
                    </select>
                </div>
                <div style="flex:1.4; min-width:160px;">
                    <label>Nazwa (szlaku / stacji)</label>
                    <input type="text" id="polecenieNazwa" placeholder="np. Legnica" style="width:100%;">
                </div>
                <div style="flex:0.8; min-width:110px;">
                    <label>Km od</label>
                    <input type="text" id="polecenieKmOd" placeholder="12,450" style="width:100%;">
                </div>
                <div style="flex:0.8; min-width:110px;">
                    <label>Km do</label>
                    <input type="text" id="polecenieKmDo" placeholder="18,200" style="width:100%;">
                </div>
            </div>

            <h3>DostÄpne znaczniki</h3>
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
    const opisEl = document.getElementById("polecenieOpis");
    if (opisEl) opisEl.innerHTML = "";
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
    const opisEl = document.getElementById("polecenieOpis");
    const opis = opisEl ? (opisEl.innerHTML || "").trim() : "";
    const rodzaj = document.getElementById("polecenieRodzaj").value || "Inne";
    const nazwa = document.getElementById("polecenieNazwa").value.trim();
    const kmOd = document.getElementById("polecenieKmOd").value.trim();
    const kmDo = document.getElementById("polecenieKmDo").value.trim();

    if (!linia) { alert("Podaj nr linii"); return; }
    if (!opisKrotki) { alert("Podaj opis krĂłtki"); return; }

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
    const opisEl = document.getElementById("polecenieOpis");
    if (opisEl) {
        const raw = row.Opis || "";
        // JeĹli plain text z \n â pokaĹź z <br>, jeĹli HTML â wstaw jak jest
        if (/<(?:b|strong|u|i|br|div|p)\b/i.test(raw)) opisEl.innerHTML = raw;
        else opisEl.innerHTML = String(raw).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    }
    document.getElementById("polecenieRodzaj").value = row.Rodzaj || "Inne";
    document.getElementById("polecenieNazwa").value = row.Nazwa || row.NazwaSzlaku || "";
    document.getElementById("polecenieKmOd").value = row.KmOd || row.Km || "";
    document.getElementById("polecenieKmDo").value = row.KmDo || "";
    document.getElementById("polecenieModal").style.display = "flex";
}

async function removePolecenie(index) {
    if (!confirm("UsunÄÄ polecenie?")) return;
    appState.polecenia.rows.splice(index, 1);
    await saveState();
    renderPolecenia();
}

function insertPolecenieTag(tag) {
    const el = document.getElementById("polecenieOpis");
    if (!el) return;
    el.focus();
    try {
        document.execCommand("insertText", false, tag);
    } catch (e) {
        el.innerHTML += tag;
    }
}

function formatPolecenieOpis(cmd) {
    const el = document.getElementById("polecenieOpis");
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, null);
}

window.openPolecenieModal = openPolecenieModal;
window.closePolecenieModal = closePolecenieModal;
window.savePolecenie = savePolecenie;
window.editPolecenie = editPolecenie;
window.removePolecenie = removePolecenie;
window.insertPolecenieTag = insertPolecenieTag;
window.formatPolecenieOpis = formatPolecenieOpis;
window.setPoleceniaFilterLinia = setPoleceniaFilterLinia;        html += `
        <div class="item-card ${selected}" onclick="togglePatrolPerson(${originalIndex})">
            ${nazwa}
        </div>`;
    });

    html += `
        </div>
        <br><br>

        <!-- Linia 1: Nazwa, Dowódca, Kierowca -->
        <div style="display:flex; flex-wrap:wrap; gap:15px; align-items:flex-end; margin-bottom:15px;">
            <div style="flex:1; min-width:180px;">
                <label>Nazwa patrolu</label>
                <input type="text" id="patrolName">
            </div>
            <div style="flex:1; min-width:180px;">
                <label>Dowódca</label>
                <select id="dowodcaSelect"><option value="">-- brak --</option></select>
            </div>
            <div style="flex:1; min-width:180px;">
                <label>Kierowca</label>
                <select id="kierowcaSelect"><option value="">-- brak --</option></select>
            </div>
        </div>

        <!-- Linia 2: WOT -->
        <div style="display:flex; flex-wrap:wrap; gap:15px; align-items:flex-end; margin-bottom:15px;">
            <div style="flex:1; min-width:180px;">
                <label>WOT 1</label>
                <input type="text" id="wot1Input" placeholder="Imię i nazwisko">
            </div>
            <div style="flex:1; min-width:180px;">
                <label>WOT 2</label>
                <input type="text" id="wot2Input" placeholder="Imię i nazwisko">
            </div>
        </div>

        <!-- Linia 3: Policjanci -->
        <div style="display:flex; flex-wrap:wrap; gap:15px; align-items:flex-end; margin-bottom:20px;">
            <div style="flex:1; min-width:180px;">
                <label>Policjant 1</label>
                <input type="text" id="policjant1Input" placeholder="Imię i nazwisko">
            </div>
            <div style="flex:1; min-width:180px;">
                <label>Policjant 2</label>
                <input type="text" id="policjant2Input" placeholder="Imię i nazwisko">
            </div>
        </div>

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
                    <th>WOT 1</th>
                    <th>WOT 2</th>
                    <th>Policjant 1</th>
                    <th>Policjant 2</th>
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
            <td>${(patrol.sklad || []).join("<br>")}</td>
            <td>${patrol.dowodca || ""}</td>
            <td>${patrol.kierowca || ""}</td>
            <td>${patrol.wot1 || ""}</td>
            <td>${patrol.wot2 || ""}</td>
            <td>${patrol.policjant1 || ""}</td>
            <td>${patrol.policjant2 || ""}</td>
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
    const wot1 = document.getElementById("wot1Input")?.value.trim() || "";
    const wot2 = document.getElementById("wot2Input")?.value.trim() || "";
    const policjant1 = document.getElementById("policjant1Input")?.value.trim() || "";
    const policjant2 = document.getElementById("policjant2Input")?.value.trim() || "";

    appState.patrole.push({ 
        nazwa, 
        sklad, 
        dowodca, 
        kierowca,
        wot1,
        wot2,
        policjant1,
        policjant2
    });

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

    const nowyWot1 = prompt("WOT 1", patrol.wot1 || "");
    if (nowyWot1 === null) return;

    const nowyWot2 = prompt("WOT 2", patrol.wot2 || "");
    if (nowyWot2 === null) return;

    const nowyPolicjant1 = prompt("Policjant 1", patrol.policjant1 || "");
    if (nowyPolicjant1 === null) return;

    const nowyPolicjant2 = prompt("Policjant 2", patrol.policjant2 || "");
    if (nowyPolicjant2 === null) return;

    patrol.nazwa = nowaNazwa;
    patrol.dowodca = nowyDowodca;
    patrol.kierowca = nowyKierowca;
    patrol.wot1 = nowyWot1;
    patrol.wot2 = nowyWot2;
    patrol.policjant1 = nowyPolicjant1;
    patrol.policjant2 = nowyPolicjant2;

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
