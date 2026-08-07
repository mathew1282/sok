// =====================================
// GENERATOR WPISÓW (bez szablonów)
// + autofilt: linie + kafelki wewnętrzne
// =====================================

let selectedPatrols = [];
let selectedZgloszeniaIndexes = [];
let selectedPoleceniaIndexes = [];
let selectedZgloszeniaLine = null;
let selectedPoleceniaLine = null;

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

// =====================================
// INICJALIZACJA
// =====================================

function initGenerator() {
    selectedPatrols = [];
    selectedZgloszeniaIndexes = [];
    selectedPoleceniaIndexes = [];
    selectedZgloszeniaLine = null;
    selectedPoleceniaLine = null;

    // upewnij się, że struktury istnieją
    if (!appState.zgloszenia) appState.zgloszenia = { columns: ["Linia", "OpisKrotki", "Opis"], rows: [] };
    if (!Array.isArray(appState.zgloszenia.rows)) appState.zgloszenia.rows = [];
    if (!appState.polecenia) appState.polecenia = { columns: ["Linia", "OpisKrotki", "Opis"], rows: [] };
    if (!Array.isArray(appState.polecenia.rows)) appState.polecenia.rows = [];
    if (!Array.isArray(appState.patrole)) appState.patrole = [];

    renderPatroleCards();
    renderZgloszeniaLines();
    renderPoleceniaLines();

    const kzInput = document.getElementById("kzInput");
    const mkkInput = document.getElementById("mkkInput");
    if (kzInput) kzInput.value = appState.kz || "";
    if (mkkInput) mkkInput.value = appState.mkk || "";

    setupPersistentInputs();
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
        <div class="select-card ${isSelected}" onclick="togglePatrol(${index})">
            <div class="select-card-title">${escapeHtml(patrol.nazwa || ("Patrol " + (index + 1)))}</div>
        </div>`;
    });
    container.innerHTML = html || "<p>Brak patroli</p>";
}

function togglePatrol(index) {
    const pos = selectedPatrols.indexOf(index);
    if (pos > -1) selectedPatrols.splice(pos, 1);
    else selectedPatrols.push(index);
    renderPatroleCards();
    updateLiveEntry();
}

// =====================================
// ZGŁOSZENIA
// =====================================

function renderZgloszeniaLines() {
    const container = document.getElementById("zgloszeniaLinie");
    if (!container) return;

    const search = (document.getElementById("zglSearch")?.value || "").toLowerCase().trim();
    const allRows = appState.zgloszenia?.rows || [];

    let lines = [...new Set(
        allRows
            .filter(row => {
                if (!search) return true;
                const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.Opis || ""}`.toLowerCase();
                return t.includes(search);
            })
            .map(r => r.Linia)
            .filter(Boolean)
    )];
    lines = sortLinesNatural(lines);

    // jeśli aktywna linia nie ma już wyników – odznacz
    if (selectedZgloszeniaLine && !lines.includes(selectedZgloszeniaLine)) {
        selectedZgloszeniaLine = null;
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
    renderZgloszeniaItems();
}

function selectZgloszeniaLine(line) {
    if (selectedZgloszeniaLine === line) {
        selectedZgloszeniaLine = null;
    } else {
        selectedZgloszeniaLine = line;
    }
    renderZgloszeniaLines();
}

function renderZgloszeniaItems() {
    const container = document.getElementById("zgloszeniaItems");
    if (!container) return;

    const search = (document.getElementById("zglSearch")?.value || "").toLowerCase().trim();
    const allRows = appState.zgloszenia?.rows || [];

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));

    if (selectedZgloszeniaLine) {
        rows = rows.filter(row => row.Linia === selectedZgloszeniaLine);
    }

    if (search) {
        rows = rows.filter(row => {
            const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.Opis || ""}`.toLowerCase();
            return t.includes(search);
        });
    }

    // bez szukania i bez wybranej linii → pusto
    if (!search && !selectedZgloszeniaLine) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    rows.forEach(row => {
        const isSelected = selectedZgloszeniaIndexes.includes(row._index);
        const label = (row.OpisKrotki || row.Opis || "(bez opisu)").substring(0, 120);
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

    renderZgloszeniaLines();
    updateLiveEntry();
}

// =====================================
// POLECENIA
// =====================================

function renderPoleceniaLines() {
    const container = document.getElementById("poleceniaLinie");
    if (!container) return;

    const search = (document.getElementById("polSearch")?.value || "").toLowerCase().trim();
    const allRows = appState.polecenia?.rows || [];

    let lines = [...new Set(
        allRows
            .filter(row => {
                if (!search) return true;
                const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.Opis || ""}`.toLowerCase();
                return t.includes(search);
            })
            .map(r => r.Linia)
            .filter(Boolean)
    )];
    lines = sortLinesNatural(lines);

    if (selectedPoleceniaLine && !lines.includes(selectedPoleceniaLine)) {
        selectedPoleceniaLine = null;
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
    renderPoleceniaItems();
}

function selectPoleceniaLine(line) {
    if (selectedPoleceniaLine === line) {
        selectedPoleceniaLine = null;
    } else {
        selectedPoleceniaLine = line;
    }
    renderPoleceniaLines();
}

function renderPoleceniaItems() {
    const container = document.getElementById("poleceniaItems");
    if (!container) return;

    const search = (document.getElementById("polSearch")?.value || "").toLowerCase().trim();
    const allRows = appState.polecenia?.rows || [];

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));

    if (selectedPoleceniaLine) {
        rows = rows.filter(row => row.Linia === selectedPoleceniaLine);
    }

    if (search) {
        rows = rows.filter(row => {
            const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.Opis || ""}`.toLowerCase();
            return t.includes(search);
        });
    }

    if (!search && !selectedPoleceniaLine) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    rows.forEach(row => {
        const isSelected = selectedPoleceniaIndexes.includes(row._index);
        const label = (row.OpisKrotki || row.Opis || "(bez opisu)").substring(0, 120);
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

    renderPoleceniaLines();
    updateLiveEntry();
}

function filterGeneratorTiles() {
    renderZgloszeniaLines();
    renderPoleceniaLines();
}

// =====================================
// GENEROWANIE
// =====================================

function buildReplacements() {
    const kz = document.getElementById("kzInput")?.value || appState.kz || "";
    const mkk = document.getElementById("mkkInput")?.value || appState.mkk || "";

    const patrolNames = [];
    const allSklad = [];
    const allDowodcy = [];
    const allKierowcy = [];
    const allWot = [];
    const allPolicjanci = [];

    selectedPatrols.forEach(index => {
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

    return {
        "@patrol":     forceOneLine(uniqueNonEmpty(patrolNames)),
        "@dowodca":    forceOneLine(uniqueNonEmpty(allDowodcy)),
        "@kierowca":   forceOneLine(uniqueNonEmpty(allKierowcy)),
        "@sklad":      forceOneLine(uniqueNonEmpty(allSklad)),
        "@wszyscy":    forceOneLine(uniqueNonEmpty([...allSklad, ...allDowodcy, ...allKierowcy])),
        "@data":       data,
        "@godzina":    godzina,
        "@KZ":         kz,
        "@MKK":        mkk,
        "@wot":        forceOneLine(uniqueNonEmpty(allWot)),
        "@policjant":  forceOneLine(uniqueNonEmpty(allPolicjanci))
    };
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

function updateLiveEntry() {
    const textarea = document.getElementById("generatedEntry");
    if (!textarea) return;

    const replacements = buildReplacements();

    const zgloszeniaParts = selectedZgloszeniaIndexes
        .map(i => appState.zgloszenia?.rows?.[i]?.Opis)
        .filter(Boolean)
        .map(t => applyTags(t, replacements));

    const poleceniaParts = selectedPoleceniaIndexes
        .map(i => appState.polecenia?.rows?.[i]?.Opis)
        .filter(Boolean)
        .map(t => applyTags(t, replacements));

    const parts = [...zgloszeniaParts, ...poleceniaParts].filter(Boolean);
    textarea.value = parts.join(" ");
}

// =====================================
// PRZYCISKI
// =====================================

function generateEntry() {
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

    selectedPatrols = [];
    selectedZgloszeniaIndexes = [];
    selectedPoleceniaIndexes = [];
    selectedZgloszeniaLine = null;
    selectedPoleceniaLine = null;

    const zSearch = document.getElementById("zglSearch");
    const pSearch = document.getElementById("polSearch");
    if (zSearch) zSearch.value = "";
    if (pSearch) pSearch.value = "";

    renderPatroleCards();
    renderZgloszeniaLines();
    renderPoleceniaLines();
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
    setTimeout(() => toast.style.opacity = "1", 10);
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
window.toggleZgloszenie = toggleZgloszenie;
window.selectPoleceniaLine = selectPoleceniaLine;
window.togglePolecenie = togglePolecenie;
window.updateLiveEntry = updateLiveEntry;
window.filterGeneratorTiles = filterGeneratorTiles;
window.showToast = showToast;
window.initGenerator = initGenerator;
