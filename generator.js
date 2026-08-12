// =====================================
// GENERATOR WPISÓW
// + 3 poziomy kafelków (linia → opis krótki → opis pom)
// + UWAGI (TAK / NIE) + @wybrani
// + logowanie sprawdzeń (Polecenia) + interwencji (Uwagi)
// + modal przypisania patroli przy każdym @patrol
// =====================================

let selectedPatrols = [];
let selectedZgloszeniaIndexes = [];
let selectedPoleceniaIndexes = [];
let selectedZgloszeniaLine = null;
let selectedPoleceniaLine = null;
let selectedZgloszeniaOpisKrotki = null;
let selectedPoleceniaOpisKrotki = null;
let selectedWybrani = [];
let uwagiWybrane = "NIE";
let selectedUwagiTyp = null;

// { "zgl_12": [ [0], [1] ], "pol_3": [ [0,1] ] }  — tablica per wystąpienie @patrol
let patrolAssignments = {};

const defaultUwagiSzablony = {
    "MKK": "Przeprowadzono kontrolę dokumentów. MKK: @MKK.",
    "Pouczony": "Osoba została pouczona o obowiązujących przepisach.",
    "Legitymowany": "Dokonywano legitymowania osób. Sprawdzono tożsamość.",
    "Inne": ""
};

// =====================================
// POMOCNICZE
// =====================================

function forceOneLine(items) {
    if (!items) return "";
    const arr = Array.isArray(items) ? items : String(items).split("\n");
    return arr
        .map(item => String(item || "").trim())
        .filter(item => item.length > 0)
        .join(", ");
}

function uniqueNonEmpty(arr) {
    return [...new Set((arr || []).map(x => String(x || "").trim()).filter(x => x.length > 0))];
}

/** Unikalne indeksy numeryczne (0 jest prawidłowy!) */
function uniqueIndexes(arr) {
    const out = [];
    const seen = new Set();
    (arr || []).forEach(x => {
        const n = Number(x);
        if (!Number.isFinite(n) || seen.has(n)) return;
        seen.add(n);
        out.push(n);
    });
    return out;
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

function escapeAttr(str) {
    return String(str || "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function getZglSearch() {
    return (document.getElementById("zglSearch")?.value || "").toLowerCase().trim();
}

function getPolSearch() {
    return (document.getElementById("polSearch")?.value || "").toLowerCase().trim();
}

function rowMatchesSearch(row, search) {
    if (!search) return true;
    const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.OpisPom || ""} ${row.Opis || ""} ${row.Nazwa || ""} ${row.NazwaSzlaku || ""} ${row.KmOd || ""} ${row.KmDo || ""} ${row.Km || ""} ${row.Rodzaj || ""}`.toLowerCase();
    return t.includes(search);
}

function sortByOpisKrotki(rows) {
    return rows.sort((a, b) => {
        const aLabel = (a.OpisKrotki || a.Opis || "").toLowerCase();
        const bLabel = (b.OpisKrotki || b.Opis || "").toLowerCase();
        return aLabel.localeCompare(bLabel, "pl", { sensitivity: "base", numeric: true });
    });
}

function nowHHMMSafe() {
    return new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function countPatrolTags(text) {
    const m = String(text || "").match(/@patrol\b/gi);
    return m ? m.length : 0;
}

function hasAnyPatrolTagInSelection() {
    let total = 0;
    selectedZgloszeniaIndexes.forEach(i => {
        total += countPatrolTags(appState.zgloszenia?.rows?.[i]?.Opis || "");
    });
    selectedPoleceniaIndexes.forEach(i => {
        total += countPatrolTags(appState.polecenia?.rows?.[i]?.Opis || "");
    });
    return total > 0;
}

function needsPatrolAssignmentModal() {
    return selectedPatrols.length > 1 && hasAnyPatrolTagInSelection();
}

function getPatrolName(index) {
    const p = appState.patrole?.[index];
    return (p && p.nazwa) ? p.nazwa : ("Patrol " + (index + 1));
}

// =====================================
// INICJALIZACJA
// =====================================

function initGenerator() {
    selectedPatrols = [];
    selectedZgloszeniaIndexes = [];
    selectedPoleceniaIndexes = [];
    selectedZgloszeniaLine = null;
    selectedPoleceniaLine = null;
    selectedZgloszeniaOpisKrotki = null;
    selectedPoleceniaOpisKrotki = null;
    selectedWybrani = [];
    uwagiWybrane = "NIE";
    selectedUwagiTyp = null;
    patrolAssignments = {};

    ensureUwagiState();

    if (!appState.zgloszenia) appState.zgloszenia = { columns: ["Linia", "OpisKrotki", "OpisPom", "Opis", "NazwaSzlaku", "Km"], rows: [] };
    if (!Array.isArray(appState.zgloszenia.rows)) appState.zgloszenia.rows = [];
    if (!appState.polecenia) appState.polecenia = { columns: ["Linia", "OpisKrotki", "OpisPom", "Opis", "Rodzaj", "Nazwa", "KmOd", "KmDo"], rows: [] };
    if (!Array.isArray(appState.polecenia.rows)) appState.polecenia.rows = [];
    if (!Array.isArray(appState.patrole)) appState.patrole = [];

    (appState.zgloszenia.rows || []).forEach(row => {
        if (row.OpisPom === undefined) row.OpisPom = "";
        if (row.NazwaSzlaku === undefined) row.NazwaSzlaku = "";
        if (row.Km === undefined) row.Km = "";
        if (row.OpisKrotki === undefined) row.OpisKrotki = row.Opis || "";
    });
    (appState.polecenia.rows || []).forEach(row => {
        if (row.OpisPom === undefined) row.OpisPom = "";
        if (row.Rodzaj === undefined) row.Rodzaj = "Inne";
        if (row.Nazwa === undefined) row.Nazwa = row.NazwaSzlaku || "";
        if (row.KmOd === undefined) row.KmOd = row.Km || "";
        if (row.KmDo === undefined) row.KmDo = "";
        if (row.OpisKrotki === undefined) row.OpisKrotki = row.Opis || "";
    });

    renderPatroleCards();
    renderZgloszeniaLines();
    renderPoleceniaLines();
    renderUwagiCards();

    const kzInput = document.getElementById("kzInput");
    const mkkInput = document.getElementById("mkkInput");
    if (kzInput) kzInput.value = appState.kz || "";
    if (mkkInput) mkkInput.value = appState.mkk || "";

    setupPersistentInputs();
    ensureWybraniModal();
    updateLiveEntry();
}

function setupPersistentInputs() {
    const kzInput = document.getElementById("kzInput");
    const mkkInput = document.getElementById("mkkInput");
    if (kzInput) {
        kzInput.oninput = () => {
            appState.kz = kzInput.value;
            saveState();
            updateLiveEntry();
        };
    }
    if (mkkInput) {
        mkkInput.oninput = () => {
            appState.mkk = mkkInput.value;
            saveState();
            updateLiveEntry();
        };
    }
}

// =====================================
// PATROLE
// =====================================

function renderPatroleCards() {
    const container = document.getElementById("patrolCards");
    if (!container) return;

    let html = "";
    (appState.patrole || []).forEach((patrol, index) => {
        const isSelected = selectedPatrols.includes(index) ? "active" : "";
        html += `
        <div class="line-pill ${isSelected}" onclick="togglePatrol(${index})">
            ${escapeHtml(patrol.nazwa || ("Patrol " + (index + 1)))}
        </div>`;
    });
    container.innerHTML = html || "<p>Brak patroli</p>";
}

function togglePatrol(index) {
    const pos = selectedPatrols.indexOf(index);
    if (pos > -1) selectedPatrols.splice(pos, 1);
    else selectedPatrols.push(index);
    selectedWybrani = [];
    patrolAssignments = {};
    renderPatroleCards();
    updateLiveEntry();
}

// =====================================
// ZGŁOSZENIA – 3 POZIOMY
// =====================================

function renderZgloszeniaLines() {
    const container = document.getElementById("zgloszeniaLinie");
    if (!container) return;

    const search = getZglSearch();
    const allRows = appState.zgloszenia?.rows || [];

    let lines = [...new Set(
        allRows.filter(row => rowMatchesSearch(row, search)).map(r => r.Linia).filter(Boolean)
    )];
    lines = sortLinesNatural(lines);

    if (selectedZgloszeniaLine && !lines.includes(selectedZgloszeniaLine)) {
        selectedZgloszeniaLine = null;
        selectedZgloszeniaOpisKrotki = null;
    }

    let html = "";
    lines.forEach(line => {
        const hasSelected = allRows.some((row, idx) =>
            row.Linia === line && selectedZgloszeniaIndexes.includes(idx)
        );
        let className = "line-pill";
        if (selectedZgloszeniaLine === line) className += " active";
        if (hasSelected) className += " has-selected";
        html += `<div class="${className}" onclick="selectZgloszeniaLine('${escapeAttr(line)}')">${escapeHtml(line)}</div>`;
    });

    container.innerHTML = html || "<p>Brak zgłoszeń</p>";
    renderZgloszeniaLevel2();
}

function selectZgloszeniaLine(line) {
    if (selectedZgloszeniaLine === line) {
        selectedZgloszeniaLine = null;
        selectedZgloszeniaOpisKrotki = null;
    } else {
        selectedZgloszeniaLine = line;
        selectedZgloszeniaOpisKrotki = null;
    }
    renderZgloszeniaLines();
}

function ensureZgloszeniaLevel3() {
    let level3 = document.getElementById("zgloszeniaLevel3");
    if (!level3) {
        const items = document.getElementById("zgloszeniaItems");
        if (!items || !items.parentNode) return null;
        level3 = document.createElement("div");
        level3.id = "zgloszeniaLevel3";
        level3.className = "card-grid";
        level3.style.marginTop = "12px";
        items.parentNode.insertBefore(level3, items.nextSibling);
    }
    return level3;
}

function renderZgloszeniaLevel2() {
    const container = document.getElementById("zgloszeniaItems");
    if (!container) return;
    const level3 = ensureZgloszeniaLevel3();

    const search = getZglSearch();
    const allRows = appState.zgloszenia?.rows || [];

    if (!selectedZgloszeniaLine && !search) {
        container.innerHTML = "";
        if (level3) level3.innerHTML = "";
        return;
    }

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));
    if (selectedZgloszeniaLine) rows = rows.filter(r => r.Linia === selectedZgloszeniaLine);
    if (search) rows = rows.filter(r => rowMatchesSearch(r, search));

    let krotkie = [...new Set(rows.map(r => r.OpisKrotki || "(bez opisu)"))];
    krotkie.sort((a, b) => a.localeCompare(b, "pl", { sensitivity: "base", numeric: true }));

    let html = "";
    krotkie.forEach(k => {
        const hasSelected = rows.some(r => (r.OpisKrotki || "(bez opisu)") === k && selectedZgloszeniaIndexes.includes(r._index));
        let className = "item-card";
        if (selectedZgloszeniaOpisKrotki === k) className += " selected";
        if (hasSelected) className += " has-selected";
        html += `<div class="${className}" onclick="selectZgloszeniaOpisKrotki('${escapeAttr(k)}')">${escapeHtml(k)}</div>`;
    });

    container.innerHTML = html || "<p>Brak wyników</p>";
    renderZgloszeniaLevel3();
}

function selectZgloszeniaOpisKrotki(k) {
    selectedZgloszeniaOpisKrotki = (selectedZgloszeniaOpisKrotki === k) ? null : k;
    renderZgloszeniaLevel2();
}

function renderZgloszeniaLevel3() {
    const container = document.getElementById("zgloszeniaLevel3");
    if (!container) return;

    if (!selectedZgloszeniaOpisKrotki) {
        container.innerHTML = "";
        return;
    }

    const search = getZglSearch();
    const allRows = appState.zgloszenia?.rows || [];
    let rows = allRows.map((row, index) => ({ ...row, _index: index }));

    if (selectedZgloszeniaLine) rows = rows.filter(r => r.Linia === selectedZgloszeniaLine);
    rows = rows.filter(r => (r.OpisKrotki || "(bez opisu)") === selectedZgloszeniaOpisKrotki);
    if (search) rows = rows.filter(r => rowMatchesSearch(r, search));

    let html = "";
    rows.forEach(row => {
        const isSelected = selectedZgloszeniaIndexes.includes(row._index);
        const label = (row.OpisPom || "(brak opisu pom)").substring(0, 120);
        html += `
        <div class="item-card ${isSelected ? "selected" : ""}" onclick="toggleZgloszenie(${row._index})">
            ${escapeHtml(label)}
        </div>`;
    });
    container.innerHTML = html || "<p>Brak wyników</p>";
}

function toggleZgloszenie(index) {
    const pos = selectedZgloszeniaIndexes.indexOf(index);
    if (pos > -1) selectedZgloszeniaIndexes.splice(pos, 1);
    else selectedZgloszeniaIndexes.push(index);
    patrolAssignments = {};
    renderZgloszeniaLines();
    updateLiveEntry();
}

// =====================================
// POLECENIA – 3 POZIOMY
// =====================================

function renderPoleceniaLines() {
    const container = document.getElementById("poleceniaLinie");
    if (!container) return;

    const search = getPolSearch();
    const allRows = appState.polecenia?.rows || [];

    let lines = [...new Set(
        allRows.filter(row => rowMatchesSearch(row, search)).map(r => r.Linia).filter(Boolean)
    )];
    lines = sortLinesNatural(lines);

    if (selectedPoleceniaLine && !lines.includes(selectedPoleceniaLine)) {
        selectedPoleceniaLine = null;
        selectedPoleceniaOpisKrotki = null;
    }

    let html = "";
    lines.forEach(line => {
        const hasSelected = allRows.some((row, idx) =>
            row.Linia === line && selectedPoleceniaIndexes.includes(idx)
        );
        let className = "line-pill";
        if (selectedPoleceniaLine === line) className += " active";
        if (hasSelected) className += " has-selected";
        html += `<div class="${className}" onclick="selectPoleceniaLine('${escapeAttr(line)}')">${escapeHtml(line)}</div>`;
    });

    container.innerHTML = html || "<p>Brak poleceń</p>";
    renderPoleceniaLevel2();
}

function selectPoleceniaLine(line) {
    if (selectedPoleceniaLine === line) {
        selectedPoleceniaLine = null;
        selectedPoleceniaOpisKrotki = null;
    } else {
        selectedPoleceniaLine = line;
        selectedPoleceniaOpisKrotki = null;
    }
    renderPoleceniaLines();
}

function ensurePoleceniaLevel3() {
    let level3 = document.getElementById("poleceniaLevel3");
    if (!level3) {
        const items = document.getElementById("poleceniaItems");
        if (!items || !items.parentNode) return null;
        level3 = document.createElement("div");
        level3.id = "poleceniaLevel3";
        level3.className = "card-grid";
        level3.style.marginTop = "12px";
        items.parentNode.insertBefore(level3, items.nextSibling);
    }
    return level3;
}

function renderPoleceniaLevel2() {
    const container = document.getElementById("poleceniaItems");
    if (!container) return;
    const level3 = ensurePoleceniaLevel3();

    const search = getPolSearch();
    const allRows = appState.polecenia?.rows || [];

    if (!selectedPoleceniaLine && !search) {
        container.innerHTML = "";
        if (level3) level3.innerHTML = "";
        return;
    }

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));
    if (selectedPoleceniaLine) rows = rows.filter(r => r.Linia === selectedPoleceniaLine);
    if (search) rows = rows.filter(r => rowMatchesSearch(r, search));

    let krotkie = [...new Set(rows.map(r => r.OpisKrotki || "(bez opisu)"))];
    krotkie.sort((a, b) => a.localeCompare(b, "pl", { sensitivity: "base", numeric: true }));

    let html = "";
    krotkie.forEach(k => {
        const hasSelected = rows.some(r => (r.OpisKrotki || "(bez opisu)") === k && selectedPoleceniaIndexes.includes(r._index));
        let className = "item-card";
        if (selectedPoleceniaOpisKrotki === k) className += " selected";
        if (hasSelected) className += " has-selected";
        html += `<div class="${className}" onclick="selectPoleceniaOpisKrotki('${escapeAttr(k)}')">${escapeHtml(k)}</div>`;
    });

    container.innerHTML = html || "<p>Brak wyników</p>";
    renderPoleceniaLevel3();
}

function selectPoleceniaOpisKrotki(k) {
    selectedPoleceniaOpisKrotki = (selectedPoleceniaOpisKrotki === k) ? null : k;
    renderPoleceniaLevel2();
}

function renderPoleceniaLevel3() {
    const container = document.getElementById("poleceniaLevel3");
    if (!container) return;

    if (!selectedPoleceniaOpisKrotki) {
        container.innerHTML = "";
        return;
    }

    const search = getPolSearch();
    const allRows = appState.polecenia?.rows || [];
    let rows = allRows.map((row, index) => ({ ...row, _index: index }));

    if (selectedPoleceniaLine) rows = rows.filter(r => r.Linia === selectedPoleceniaLine);
    rows = rows.filter(r => (r.OpisKrotki || "(bez opisu)") === selectedPoleceniaOpisKrotki);
    if (search) rows = rows.filter(r => rowMatchesSearch(r, search));

    let html = "";
    rows.forEach(row => {
        const isSelected = selectedPoleceniaIndexes.includes(row._index);
        const label = (row.OpisPom || "(brak opisu pom)").substring(0, 120);
        html += `
        <div class="item-card ${isSelected ? "selected" : ""}" onclick="togglePolecenie(${row._index})">
            ${escapeHtml(label)}
        </div>`;
    });
    container.innerHTML = html || "<p>Brak wyników</p>";
}

function togglePolecenie(index) {
    const pos = selectedPoleceniaIndexes.indexOf(index);
    if (pos > -1) selectedPoleceniaIndexes.splice(pos, 1);
    else selectedPoleceniaIndexes.push(index);
    patrolAssignments = {};
    renderPoleceniaLines();
    updateLiveEntry();
}

function filterGeneratorTiles() {
    renderZgloszeniaLines();
    renderPoleceniaLines();
}

// =====================================
// LOGOWANIE SPRAWDZEŃ
// =====================================

function getSelectedPoleceniaDoSprawdzen() {
    const rows = appState.polecenia?.rows || [];
    const allowed = ["Szlak", "Stacja towarowa", "Stacja osobowa"];
    return selectedPoleceniaIndexes
        .map(i => ({ ...rows[i], _index: i }))
        .filter(r => r && allowed.includes(r.Rodzaj));
}

function openLogSprawdzenModal() {
    const items = getSelectedPoleceniaDoSprawdzen();
    if (items.length === 0) {
        showToast("Zaznacz polecenie typu Szlak / Stacja towarowa / Stacja osobowa");
        return;
    }

    let existing = document.getElementById("logSprawdzenModal");
    if (existing) existing.remove();

    const now = nowHHMMSafe();
    const overlay = document.createElement("div");
    overlay.id = "logSprawdzenModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";

    let body = items.map((it, idx) => `
        <div style="border:1px solid #334155; border-radius:10px; padding:12px; margin-bottom:12px;">
            <div style="font-weight:600; margin-bottom:8px;">${escapeHtml(it.Rodzaj)} – ${escapeHtml(it.Nazwa || it.OpisKrotki || "")}</div>
            <div style="font-size:13px; color:#94a3b8; margin-bottom:8px;">
                Linia: ${escapeHtml(it.Linia || "")} | Km: ${escapeHtml(it.KmOd || "")} – ${escapeHtml(it.KmDo || "")}
            </div>
            <label>Godzina rozpoczęcia</label>
            <input type="text" id="sprawdGodzOd_${idx}" value="${now}" placeholder="gg:mm" style="width:100%; margin-bottom:8px;">
            <label>Szacunkowa godzina zakończenia</label>
            <input type="text" id="sprawdGodzDo_${idx}" value="${now}" placeholder="gg:mm" style="width:100%;">
        </div>
    `).join("");

    overlay.innerHTML = `
        <div class="modal" style="max-width:560px;">
            <h2>Zaloguj sprawdzenie</h2>
            <p style="color:#94a3b8; font-size:14px;">Podaj godziny (gg:mm) dla każdego zaznaczonego polecenia.</p>
            ${body}
            <div class="modal-actions">
                <button class="btn-success" onclick="confirmLogSprawdzen()">Zapisz do statystyk</button>
                <button class="btn-danger" onclick="closeLogSprawdzenModal()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function closeLogSprawdzenModal() {
    const m = document.getElementById("logSprawdzenModal");
    if (m) m.remove();
}

async function confirmLogSprawdzen() {
    const items = getSelectedPoleceniaDoSprawdzen();
    if (!items.length) return;

    for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const godzOd = (document.getElementById(`sprawdGodzOd_${idx}`)?.value || "").trim();
        const godzDo = (document.getElementById(`sprawdGodzDo_${idx}`)?.value || "").trim();
        if (!godzOd || !godzDo) {
            showToast("Uzupełnij godziny (gg:mm)");
            return;
        }
        if (typeof logSprawdzenie === "function") {
            await logSprawdzenie({
                rodzaj: it.Rodzaj,
                nazwa: it.Nazwa || it.OpisKrotki || "",
                linia: it.Linia || "",
                kmOd: it.KmOd || "",
                kmDo: it.KmDo || "",
                godzOd,
                godzDo
            });
        }
    }

    closeLogSprawdzenModal();
    showToast("✅ Zapisano sprawdzenia w statystykach");
}

// =====================================
// UWAGI (TAK / NIE)
// =====================================

function ensureUwagiState() {
    if (!appState.uwagiSzablony) {
        appState.uwagiSzablony = { ...defaultUwagiSzablony };
    }
    Object.keys(defaultUwagiSzablony).forEach(k => {
        if (appState.uwagiSzablony[k] === undefined) {
            appState.uwagiSzablony[k] = defaultUwagiSzablony[k];
        }
    });
}

function renderUwagiCards() {
    const nie = document.getElementById("uwagiNie");
    const tak = document.getElementById("uwagiTak");
    if (!nie || !tak) return;
    if (uwagiWybrane === "NIE") {
        nie.classList.add("active");
        tak.classList.remove("active");
    } else {
        tak.classList.add("active");
        nie.classList.remove("active");
    }
}

function setUwagi(val) {
    uwagiWybrane = val;
    renderUwagiCards();
    if (val === "TAK") openUwagiModal();
}

function ensureUwagiModal() {
    if (document.getElementById("uwagiModal")) return;
    const overlay = document.createElement("div");
    overlay.id = "uwagiModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "none";
    overlay.innerHTML = `
        <div class="modal" style="max-width:720px;">
            <h2>Uwagi</h2>
            <div style="margin-bottom:18px;">
                <div style="font-size:14px; color:#94a3b8; margin-bottom:10px;">Wybierz typ uwagi:</div>
                <div class="card-grid" id="uwagiTypy">
                    <div class="item-card" onclick="wybierzTypUwagi('MKK')">MKK</div>
                    <div class="item-card" onclick="wybierzTypUwagi('Pouczony')">Pouczony</div>
                    <div class="item-card" onclick="wybierzTypUwagi('Legitymowany')">Legitymowany</div>
                    <div class="item-card" onclick="wybierzTypUwagi('Inne')">Inne</div>
                </div>
            </div>
            <div style="margin-bottom:12px;">
                <button class="btn-primary" onclick="openUwagiSzablonyModal()">Szablony</button>
            </div>
            <label style="display:block; margin-bottom:6px;">Treść uwagi (możesz edytować):</label>
            <textarea id="uwagiTekst" rows="8" style="width:100%; font-family:inherit; margin-bottom:15px;"></textarea>
            <div class="modal-actions">
                <button class="btn-success" onclick="wstawUwagi()">Wstaw</button>
                <button class="btn-danger" onclick="closeUwagiModal()">Wyjdź</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function openUwagiModal() {
    ensureUwagiState();
    ensureUwagiModal();
    selectedUwagiTyp = null;
    document.getElementById("uwagiTekst").value = "";
    document.getElementById("uwagiModal").style.display = "flex";
}

function closeUwagiModal() {
    const m = document.getElementById("uwagiModal");
    if (m) m.style.display = "none";
}

function wybierzTypUwagi(typ) {
    ensureUwagiState();
    selectedUwagiTyp = typ;
    const tekst = appState.uwagiSzablony[typ] || "";
    const textarea = document.getElementById("uwagiTekst");
    if (!textarea) return;
    const replacements = buildReplacements();
    delete replacements["@wybrani"];
    textarea.value = applyTags(tekst, replacements);
}

function ensureUwagiSzablonyModal() {
    if (document.getElementById("uwagiSzablonyModal")) return;
    const overlay = document.createElement("div");
    overlay.id = "uwagiSzablonyModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "none";
    overlay.innerHTML = `
        <div class="modal" style="max-width:800px;">
            <h2>Szablony uwag</h2>
            <p style="color:#94a3b8; font-size:14px; margin-bottom:15px;">
                Edytuj szablony. Możesz używać znaczników:<br>
                @patrol, @sklad, @dowodca, @kierowca, @wszyscy, @KZ, @MKK, @data, @godzina, @wybrani, @wot, @policjant
            </p>
            <label>MKK</label>
            <textarea id="szablonMKK" rows="3" style="width:100%; margin-bottom:12px;"></textarea>
            <label>Pouczony</label>
            <textarea id="szablonPouczony" rows="3" style="width:100%; margin-bottom:12px;"></textarea>
            <label>Legitymowany</label>
            <textarea id="szablonLegitymowany" rows="3" style="width:100%; margin-bottom:12px;"></textarea>
            <label>Inne</label>
            <textarea id="szablonInne" rows="3" style="width:100%; margin-bottom:12px;"></textarea>
            <div class="modal-actions">
                <button class="btn-success" onclick="saveUwagiSzablony()">Zapisz szablony</button>
                <button class="btn-danger" onclick="closeUwagiSzablonyModal()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function openUwagiSzablonyModal() {
    ensureUwagiState();
    ensureUwagiSzablonyModal();
    document.getElementById("szablonMKK").value = appState.uwagiSzablony["MKK"] || "";
    document.getElementById("szablonPouczony").value = appState.uwagiSzablony["Pouczony"] || "";
    document.getElementById("szablonLegitymowany").value = appState.uwagiSzablony["Legitymowany"] || "";
    document.getElementById("szablonInne").value = appState.uwagiSzablony["Inne"] || "";
    document.getElementById("uwagiSzablonyModal").style.display = "flex";
}

function closeUwagiSzablonyModal() {
    const m = document.getElementById("uwagiSzablonyModal");
    if (m) m.style.display = "none";
}

async function saveUwagiSzablony() {
    ensureUwagiState();
    appState.uwagiSzablony["MKK"] = document.getElementById("szablonMKK").value;
    appState.uwagiSzablony["Pouczony"] = document.getElementById("szablonPouczony").value;
    appState.uwagiSzablony["Legitymowany"] = document.getElementById("szablonLegitymowany").value;
    appState.uwagiSzablony["Inne"] = document.getElementById("szablonInne").value;
    await saveState();
    closeUwagiSzablonyModal();
    showToast("✅ Szablony zapisane");
}

function wstawUwagi() {
    let tekst = (document.getElementById("uwagiTekst")?.value || "").trim();
    if (!tekst) {
        showToast("Wpisz treść uwagi");
        return;
    }

    if (/@wybrani/i.test(tekst)) {
        const people = getSkladFromSelectedPatrols();
        if (people.length === 0) {
            showToast("Brak osób w składzie zaznaczonych patroli");
            return;
        }
        window._uwagiTekstDoWstawienia = tekst;
        closeUwagiModal();
        openWybraniModalForUwagi();
        return;
    }

    tekst = applyTags(tekst, buildReplacements());
    wstawTekstUwagiDoWpis(tekst);
}

function wstawTekstUwagiDoWpis(tekst) {
    const textarea = document.getElementById("generatedEntry");
    if (!textarea) return;

    let current = textarea.value || "";
    const regex = /(brak wydarzeń|bez wydarzeń)/gi;

    if (regex.test(current)) {
        current = current.replace(regex, tekst);
    } else {
        current = current.trim() + (current.trim() ? " - " : "") + tekst;
    }

    textarea.value = current;
    closeUwagiModal();

    if (typeof logInterwencja === "function") {
        logInterwencja(selectedUwagiTyp || "Inne");
    }
    selectedUwagiTyp = null;
    showToast("✅ Uwaga wstawiona");
}

function openWybraniModalForUwagi() {
    ensureWybraniModal();
    const people = getSkladFromSelectedPatrols();
    if (people.length === 0) {
        showToast("Brak osób w składzie zaznaczonych patroli");
        return;
    }

    selectedWybrani = selectedWybrani.filter(p => people.includes(p));

    const list = document.getElementById("wybraniList");
    let html = "";
    people.forEach((name, i) => {
        const isSelected = selectedWybrani.includes(name) ? "selected" : "";
        html += `<div class="item-card ${isSelected}" onclick="toggleWybranaOsobaUwagi(${i})">${escapeHtml(name)}</div>`;
    });
    list.innerHTML = html;

    updateUwagiLivePreview();

    const actions = document.querySelector("#wybraniModal .modal-actions");
    if (actions) {
        actions.innerHTML = `
            <button class="btn-success" onclick="confirmWybraniUwagi()">Zatwierdź i wstaw</button>
            <button class="btn-primary" onclick="selectAllWybraniUwagi()">Zaznacz wszystkich</button>
            <button class="btn-danger" onclick="closeWybraniModal()">Anuluj</button>
        `;
    }

    let preview = document.getElementById("uwagiLivePreview");
    if (!preview) {
        preview = document.createElement("div");
        preview.id = "uwagiLivePreview";
        preview.style.cssText = "margin-top:15px; padding:12px; background:#0f172a; border-radius:10px; font-size:14px; color:#e2e8f0; border:1px solid #334155;";
        const listEl = document.getElementById("wybraniList");
        if (listEl && listEl.parentNode) {
            listEl.parentNode.insertBefore(preview, actions);
        }
    }

    document.getElementById("wybraniModal").style.display = "flex";
}

function toggleWybranaOsobaUwagi(index) {
    const people = getSkladFromSelectedPatrols();
    const name = people[index];
    if (!name) return;
    const pos = selectedWybrani.indexOf(name);
    if (pos > -1) selectedWybrani.splice(pos, 1);
    else selectedWybrani.push(name);
    document.querySelectorAll("#wybraniList .item-card").forEach((card, i) => {
        if (selectedWybrani.includes(people[i])) card.classList.add("selected");
        else card.classList.remove("selected");
    });
    updateUwagiLivePreview();
}

function selectAllWybraniUwagi() {
    selectedWybrani = [...getSkladFromSelectedPatrols()];
    document.querySelectorAll("#wybraniList .item-card").forEach(card => card.classList.add("selected"));
    updateUwagiLivePreview();
}

function updateUwagiLivePreview() {
    const preview = document.getElementById("uwagiLivePreview");
    if (!preview) return;
    const tekst = window._uwagiTekstDoWstawienia || "";
    const wynik = applyTags(tekst, buildReplacements());
    preview.innerHTML = `<strong>Podgląd:</strong><br>${escapeHtml(wynik || "(brak tekstu)")}`;
}

function confirmWybraniUwagi() {
    if (selectedWybrani.length === 0) {
        showToast("Wybierz przynajmniej jedną osobę");
        return;
    }

    const tekst = window._uwagiTekstDoWstawienia || "";
    const gotowyTekst = applyTags(tekst, buildReplacements());

    closeWybraniModal();
    closeUwagiModal();
    wstawTekstUwagiDoWpis(gotowyTekst);

    window._uwagiTekstDoWstawienia = "";
    selectedWybrani = [];

    const preview = document.getElementById("uwagiLivePreview");
    if (preview) preview.remove();

    const actions = document.querySelector("#wybraniModal .modal-actions");
    if (actions) {
        actions.innerHTML = `
            <button class="btn-success" onclick="confirmWybrani()">Zatwierdź i generuj</button>
            <button class="btn-primary" onclick="selectAllWybrani()">Zaznacz wszystkich</button>
            <button class="btn-danger" onclick="closeWybraniModal()">Anuluj</button>
        `;
    }
}

// =====================================
// GENEROWANIE + PRZYPISANIA @patrol
// =====================================

function getSkladFromSelectedPatrols() {
    const allSklad = [];
    selectedPatrols.forEach(index => {
        const patrol = appState.patrole?.[index];
        if (!patrol || !Array.isArray(patrol.sklad)) return;
        patrol.sklad.forEach(p => { if (p) allSklad.push(p); });
    });
    return uniqueNonEmpty(allSklad);
}

function hasWybraniTag() {
    const texts = [];
    selectedZgloszeniaIndexes.forEach(i => texts.push(appState.zgloszenia?.rows?.[i]?.Opis || ""));
    selectedPoleceniaIndexes.forEach(i => texts.push(appState.polecenia?.rows?.[i]?.Opis || ""));
    return /@wybrani/i.test(texts.join(" "));
}

function buildReplacementsForPatrols(patrolIndexes) {
    const idxs = uniqueIndexes(patrolIndexes);
    const kz = document.getElementById("kzInput")?.value || appState.kz || "";
    const mkk = document.getElementById("mkkInput")?.value || appState.mkk || "";

    const patrolNames = [];
    const allSklad = [];
    const allDowodcy = [];
    const allKierowcy = [];
    const allWot = [];
    const allPolicjanci = [];

    idxs.forEach(index => {
        const patrol = appState.patrole?.[index];
        if (!patrol) return;
        if (patrol.nazwa) patrolNames.push(patrol.nazwa);
        if (Array.isArray(patrol.sklad)) {
            patrol.sklad.forEach(p => { if (p) allSklad.push(p); });
        }
        if (patrol.dowodca) allDowodcy.push(patrol.dowodca);
        if (patrol.kierowca) allKierowcy.push(patrol.kierowca);
        if (patrol.wot1) allWot.push(patrol.wot1);
        if (patrol.wot2) allWot.push(patrol.wot2);
        if (patrol.policjant1) allPolicjanci.push(patrol.policjant1);
        if (patrol.policjant2) allPolicjanci.push(patrol.policjant2);
    });

    const now = new Date();
    const data = now.toLocaleDateString("pl-PL");
    const godzina = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

    const wybraniValue = selectedWybrani.length > 0
        ? forceOneLine(uniqueNonEmpty(selectedWybrani))
        : "";

    return {
        "@patrol":    forceOneLine(uniqueNonEmpty(patrolNames)),
        "@dowodca":   forceOneLine(uniqueNonEmpty(allDowodcy)),
        "@kierowca":  forceOneLine(uniqueNonEmpty(allKierowcy)),
        "@sklad":     forceOneLine(uniqueNonEmpty(allSklad)),
        "@wszyscy":   forceOneLine(uniqueNonEmpty([...allSklad, ...allDowodcy, ...allKierowcy])),
        "@wybrani":   wybraniValue,
        "@data":      data,
        "@godzina":   godzina,
        "@KZ":        kz,
        "@MKK":       mkk,
        "@wot":       forceOneLine(uniqueNonEmpty(allWot)),
        "@policjant": forceOneLine(uniqueNonEmpty(allPolicjanci))
    };
}

function buildReplacements() {
    return buildReplacementsForPatrols(selectedPatrols);
}

function applyTags(text, replacements) {
    let out = String(text || "");
    for (let pass = 0; pass < 2; pass++) {
        Object.entries(replacements).forEach(([tag, value]) => {
            const safe = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            out = out.replace(new RegExp(safe, "gi"), value || "");
        });
    }
    return out.replace(/\n+/g, " ").trim();
}

/** Każde @patrol osobno z occurrenceList; reszta tagów z unii użytych patroli */
function applyTextWithPatrolOccurrences(text, occurrenceList) {
    const list = occurrenceList || [];
    const raw = String(text || "");
    const matches = [...raw.matchAll(/@patrol\b/gi)];

    if (matches.length === 0) {
        return applyTags(raw, buildReplacementsForPatrols(selectedPatrols));
    }

    let out = "";
    let last = 0;
    const usedIndexes = [];

    matches.forEach((m, occ) => {
        out += raw.slice(last, m.index);

        let idxs = uniqueIndexes(list[occ]);
        if (!idxs.length) idxs = uniqueIndexes(selectedPatrols);

        idxs.forEach(i => usedIndexes.push(i));

        const names = idxs.map(i => getPatrolName(i));
        out += forceOneLine(uniqueNonEmpty(names)) || "";
        last = m.index + m[0].length;
    });
    out += raw.slice(last);

    const uniqueUsed = uniqueIndexes(usedIndexes.length ? usedIndexes : selectedPatrols);
    const replacements = buildReplacementsForPatrols(uniqueUsed);
    delete replacements["@patrol"];

    return applyTags(out, replacements);
}

function updateLiveEntry() {
    const textarea = document.getElementById("generatedEntry");
    const banner = document.getElementById("wybraniHintBanner");
    if (!textarea) return;

    const needsWybraniHint = hasWybraniTag() && selectedWybrani.length === 0;
    const hintPlain = "⚠ KLIKNIJ „GENERUJ WPIS”, ABY WYBRAĆ OSOBY";

    const replacements = buildReplacements();
    const replacementsForApply = { ...replacements };
    if (needsWybraniHint) replacementsForApply["@wybrani"] = hintPlain;

    const zgloszeniaParts = selectedZgloszeniaIndexes
        .map(i => appState.zgloszenia?.rows?.[i]?.Opis)
        .filter(Boolean)
        .map(t => applyTags(t, replacementsForApply));

    const poleceniaParts = selectedPoleceniaIndexes
        .map(i => appState.polecenia?.rows?.[i]?.Opis)
        .filter(Boolean)
        .map(t => applyTags(t, replacementsForApply));

    textarea.value = [...zgloszeniaParts, ...poleceniaParts].filter(Boolean).join(" ");

    if (banner) banner.style.display = needsWybraniHint ? "block" : "none";
}

function updateLiveEntryWithAssignments() {
    const textarea = document.getElementById("generatedEntry");
    const banner = document.getElementById("wybraniHintBanner");
    if (!textarea) return;

    const needsWybraniHint = hasWybraniTag() && selectedWybrani.length === 0;
    const hintPlain = "⚠ KLIKNIJ „GENERUJ WPIS”, ABY WYBRAĆ OSOBY";
    const parts = [];

    selectedZgloszeniaIndexes.forEach(i => {
        const t = appState.zgloszenia?.rows?.[i]?.Opis;
        if (!t) return;
        const key = `zgl_${i}`;
        let text = applyTextWithPatrolOccurrences(t, patrolAssignments[key]);
        if (needsWybraniHint) text = text.replace(/@wybrani/gi, hintPlain);
        else if (selectedWybrani.length > 0) text = text.replace(/@wybrani/gi, forceOneLine(uniqueNonEmpty(selectedWybrani)));
        parts.push(text);
    });

    selectedPoleceniaIndexes.forEach(i => {
        const t = appState.polecenia?.rows?.[i]?.Opis;
        if (!t) return;
        const key = `pol_${i}`;
        let text = applyTextWithPatrolOccurrences(t, patrolAssignments[key]);
        if (needsWybraniHint) text = text.replace(/@wybrani/gi, hintPlain);
        else if (selectedWybrani.length > 0) text = text.replace(/@wybrani/gi, forceOneLine(uniqueNonEmpty(selectedWybrani)));
        parts.push(text);
    });

    textarea.value = parts.filter(Boolean).join(" ");
    if (banner) banner.style.display = needsWybraniHint ? "block" : "none";
}

// =====================================
// MODAL PRZYPISANIA PATROLI (per @patrol)
// =====================================

function ensurePatrolAssignModal() {
    if (document.getElementById("patrolAssignModal")) return;

    const overlay = document.createElement("div");
    overlay.id = "patrolAssignModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "none";
    overlay.innerHTML = `
        <div class="modal" style="max-width:780px;">
            <h2>Przypisz patrole do @patrol</h2>
            <p style="color:#94a3b8; font-size:14px; margin-bottom:15px;">
                Przy każdym wystąpieniu <strong>@patrol</strong> wybierz kafelkami, który patrol (lub które) ma się wstawić.
                Skład, dowódca i kierowca dobierą się automatycznie z wybranych patroli.
            </p>
            <div id="patrolAssignList" style="max-height:55vh; overflow:auto;"></div>
            <div class="modal-actions">
                <button class="btn-success" onclick="confirmPatrolAssignments()">Zatwierdź i generuj</button>
                <button class="btn-danger" onclick="closePatrolAssignModal()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function openPatrolAssignModal() {
    ensurePatrolAssignModal();
    patrolAssignments = {};

    const list = document.getElementById("patrolAssignList");
    let html = "";
    let globalOcc = 0;

    const addSource = (prefix, indexes, rows, labelPrefix) => {
        indexes.forEach(i => {
            const row = rows?.[i];
            if (!row) return;
            const text = row.Opis || "";
            const count = countPatrolTags(text);
            if (count === 0) return;

            const key = `${prefix}_${i}`;
            patrolAssignments[key] = [];

            const short = (row.OpisKrotki || row.OpisPom || text).substring(0, 90);
            html += `
            <div style="border:1px solid #334155; border-radius:12px; padding:14px; margin-bottom:14px;">
                <div style="font-weight:600; margin-bottom:4px;">${escapeHtml(labelPrefix)}: ${escapeHtml(short)}</div>
                <div style="font-size:12px; color:#94a3b8; margin-bottom:12px;">${escapeHtml(text.substring(0, 160))}${text.length > 160 ? "…" : ""}</div>
            `;

            for (let occ = 0; occ < count; occ++) {
                // domyślnie: pierwszy zaznaczony patrol (można zmienić)
                patrolAssignments[key][occ] = selectedPatrols.length ? [selectedPatrols[0]] : [];
                globalOcc++;
                const rowId = `assign_${key}_${occ}`;

                html += `
                <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:10px;">
                    <div style="min-width:90px; font-weight:600; color:#e2e8f0;">${globalOcc}. @patrol</div>
                    <div class="card-grid" style="margin:0;" id="${rowId}">
                        ${selectedPatrols.map(pIdx => {
                            const name = getPatrolName(pIdx);
                            const active = (patrolAssignments[key][occ] || []).includes(pIdx) ? "active" : "";
                            return `<div class="line-pill ${active}" onclick="togglePatrolOccurrence('${key}', ${occ}, ${pIdx})">${escapeHtml(name)}</div>`;
                        }).join("")}
                    </div>
                </div>`;
            }

            html += `</div>`;
        });
    };

    addSource("zgl", selectedZgloszeniaIndexes, appState.zgloszenia?.rows, "Zgłoszenie");
    addSource("pol", selectedPoleceniaIndexes, appState.polecenia?.rows, "Polecenie");

    if (!html) html = "<p>Brak wystąpień @patrol w zaznaczonych pozycjach.</p>";

    list.innerHTML = html;
    document.getElementById("patrolAssignModal").style.display = "flex";
}

function togglePatrolOccurrence(key, occ, patrolIndex) {
    if (!patrolAssignments[key]) patrolAssignments[key] = [];
    if (!Array.isArray(patrolAssignments[key][occ])) {
        patrolAssignments[key][occ] = [];
    }

    const arr = patrolAssignments[key][occ];
    const pos = arr.indexOf(patrolIndex);
    if (pos > -1) arr.splice(pos, 1);
    else arr.push(patrolIndex);

    const container = document.getElementById(`assign_${key}_${occ}`);
    if (!container) return;

    container.querySelectorAll(".line-pill").forEach((el, i) => {
        const pIdx = selectedPatrols[i];
        if (arr.includes(pIdx)) el.classList.add("active");
        else el.classList.remove("active");
    });
}

function closePatrolAssignModal() {
    const m = document.getElementById("patrolAssignModal");
    if (m) m.style.display = "none";
}

function confirmPatrolAssignments() {
    for (const key of Object.keys(patrolAssignments)) {
        const list = patrolAssignments[key] || [];
        for (let occ = 0; occ < list.length; occ++) {
            if (!list[occ] || list[occ].length === 0) {
                showToast("Przy każdym @patrol wybierz przynajmniej jeden patrol");
                return;
            }
        }
    }

    closePatrolAssignModal();

    if (hasWybraniTag()) {
        const opened = openWybraniModal();
        if (!opened) {
            selectedWybrani = [];
            updateLiveEntryWithAssignments();
        }
        return;
    }

    updateLiveEntryWithAssignments();
    showToast("✅ Wpis wygenerowany z przypisanymi patrolami");
}

// =====================================
// MODAL @wybrani
// =====================================

function ensureWybraniModal() {
    if (document.getElementById("wybraniModal")) return;
    const overlay = document.createElement("div");
    overlay.id = "wybraniModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "none";
    overlay.innerHTML = `
        <div class="modal" style="max-width:640px;">
            <h2>Wybierz osoby ze składu patrolu</h2>
            <p style="margin-bottom:15px; color:#94a3b8; font-size:14px;">
                Zaznacz kliknięciem osoby, które mają pojawić się w miejscu znacznika <strong>@wybrani</strong>.
            </p>
            <div id="wybraniList" class="card-grid" style="max-height:50vh; overflow:auto;"></div>
            <div class="modal-actions">
                <button class="btn-success" onclick="confirmWybrani()">Zatwierdź i generuj</button>
                <button class="btn-primary" onclick="selectAllWybrani()">Zaznacz wszystkich</button>
                <button class="btn-danger" onclick="closeWybraniModal()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function openWybraniModal() {
    ensureWybraniModal();
    const people = getSkladFromSelectedPatrols();
    if (people.length === 0) {
        showToast("Brak osób w składzie zaznaczonych patroli");
        return false;
    }
    selectedWybrani = selectedWybrani.filter(p => people.includes(p));
    const list = document.getElementById("wybraniList");
    let html = "";
    people.forEach((name, i) => {
        const isSelected = selectedWybrani.includes(name) ? "selected" : "";
        html += `
        <div class="item-card ${isSelected}" onclick="toggleWybranaOsoba(${i})" data-name="${escapeAttr(name)}">
            ${escapeHtml(name)}
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById("wybraniModal").style.display = "flex";
    return true;
}

function toggleWybranaOsoba(index) {
    const people = getSkladFromSelectedPatrols();
    const name = people[index];
    if (!name) return;
    const pos = selectedWybrani.indexOf(name);
    if (pos > -1) selectedWybrani.splice(pos, 1);
    else selectedWybrani.push(name);
    document.querySelectorAll("#wybraniList .item-card").forEach((card, i) => {
        if (selectedWybrani.includes(people[i])) card.classList.add("selected");
        else card.classList.remove("selected");
    });
}

function selectAllWybrani() {
    selectedWybrani = [...getSkladFromSelectedPatrols()];
    document.querySelectorAll("#wybraniList .item-card").forEach(card => card.classList.add("selected"));
}

function closeWybraniModal() {
    const modal = document.getElementById("wybraniModal");
    if (modal) modal.style.display = "none";
}

function confirmWybrani() {
    if (selectedWybrani.length === 0) {
        showToast("Wybierz przynajmniej jedną osobę");
        return;
    }
    closeWybraniModal();

    if (Object.keys(patrolAssignments).length > 0) {
        updateLiveEntryWithAssignments();
    } else {
        updateLiveEntry();
    }
    showToast("✅ Wpis wygenerowany z wybranymi osobami");
}

// =====================================
// PRZYCISKI
// =====================================

function generateEntry() {
    if (needsPatrolAssignmentModal()) {
        openPatrolAssignModal();
        return;
    }

    patrolAssignments = {};

    if (hasWybraniTag()) {
        const opened = openWybraniModal();
        if (!opened) {
            selectedWybrani = [];
            updateLiveEntry();
        }
        return;
    }

    selectedWybrani = [];
    updateLiveEntry();
}

function copyEntry() {
    const textarea = document.getElementById("generatedEntry");
    if (!textarea || !textarea.value.trim()) {
        showToast("Najpierw wygeneruj wpis");
        return;
    }
    navigator.clipboard.writeText(textarea.value).then(() => {
        showToast("✅ Skopiowano do schowka");
    }).catch(() => showToast("Nie udało się skopiować"));
}

function clearEntry() {
    const textarea = document.getElementById("generatedEntry");
    if (textarea) textarea.value = "";

    const banner = document.getElementById("wybraniHintBanner");
    if (banner) banner.style.display = "none";

    selectedPatrols = [];
    selectedZgloszeniaIndexes = [];
    selectedPoleceniaIndexes = [];
    selectedZgloszeniaLine = null;
    selectedPoleceniaLine = null;
    selectedZgloszeniaOpisKrotki = null;
    selectedPoleceniaOpisKrotki = null;
    selectedWybrani = [];
    uwagiWybrane = "NIE";
    selectedUwagiTyp = null;
    patrolAssignments = {};

    const zSearch = document.getElementById("zglSearch");
    const pSearch = document.getElementById("polSearch");
    if (zSearch) zSearch.value = "";
    if (pSearch) pSearch.value = "";

    renderPatroleCards();
    renderZgloszeniaLines();
    renderPoleceniaLines();
    renderUwagiCards();
    updateLiveEntry();
    showToast("Odznaczono wszystko");
}

function showToast(message) {
    const old = document.getElementById("toastMsg");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.id = "toastMsg";
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px;
        background: #16a34a; color: white;
        padding: 14px 22px; border-radius: 10px;
        font-size: 15px; font-weight: 600; z-index: 9999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        opacity: 0; transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "1"; }, 10);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// =====================================
// EXPOSE
// =====================================
window.generateEntry = generateEntry;
window.copyEntry = copyEntry;
window.clearEntry = clearEntry;
window.togglePatrol = togglePatrol;
window.selectZgloszeniaLine = selectZgloszeniaLine;
window.selectZgloszeniaOpisKrotki = selectZgloszeniaOpisKrotki;
window.toggleZgloszenie = toggleZgloszenie;
window.selectPoleceniaLine = selectPoleceniaLine;
window.selectPoleceniaOpisKrotki = selectPoleceniaOpisKrotki;
window.togglePolecenie = togglePolecenie;
window.updateLiveEntry = updateLiveEntry;
window.filterGeneratorTiles = filterGeneratorTiles;
window.showToast = showToast;
window.initGenerator = initGenerator;
window.toggleWybranaOsoba = toggleWybranaOsoba;
window.selectAllWybrani = selectAllWybrani;
window.confirmWybrani = confirmWybrani;
window.closeWybraniModal = closeWybraniModal;

window.setUwagi = setUwagi;
window.wybierzTypUwagi = wybierzTypUwagi;
window.openUwagiSzablonyModal = openUwagiSzablonyModal;
window.closeUwagiSzablonyModal = closeUwagiSzablonyModal;
window.saveUwagiSzablony = saveUwagiSzablony;
window.wstawUwagi = wstawUwagi;
window.closeUwagiModal = closeUwagiModal;
window.toggleWybranaOsobaUwagi = toggleWybranaOsobaUwagi;
window.selectAllWybraniUwagi = selectAllWybraniUwagi;
window.confirmWybraniUwagi = confirmWybraniUwagi;

window.openLogSprawdzenModal = openLogSprawdzenModal;
window.closeLogSprawdzenModal = closeLogSprawdzenModal;
window.confirmLogSprawdzen = confirmLogSprawdzen;

window.togglePatrolOccurrence = togglePatrolOccurrence;
window.confirmPatrolAssignments = confirmPatrolAssignments;
window.closePatrolAssignModal = closePatrolAssignModal;
