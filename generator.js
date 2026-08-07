// =====================================
// GENERATOR WPISÓW
// =====================================

let selectedPatrols = [];
let selectedZgloszeniaIndexes = []; // indeksy z appState.zgloszenia.rows
let selectedPoleceniaIndexes = [];  // indeksy z appState.polecenia.rows
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
    return lines.sort((a, b) => {
        const aStr = String(a || "").trim();
        const bStr = String(b || "").trim();

        const aIsNum = /^\d/.test(aStr);
        const bIsNum = /^\d/.test(bStr);

        if (aIsNum && !bIsNum) return -1;
        if (!aIsNum && bIsNum) return 1;

        if (aIsNum && bIsNum) {
            const aNum = parseInt(aStr, 10);
            const bNum = parseInt(bStr, 10);
            if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) {
                return aNum - bNum;
            }
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

// =====================================
// INICJALIZACJA
// =====================================

function initGenerator() {
    selectedPatrols = [];
    selectedZgloszeniaIndexes = [];
    selectedPoleceniaIndexes = [];
    selectedZgloszeniaLine = null;
    selectedPoleceniaLine = null;

    renderPatroleCards();
    renderTemplateList();
    renderZgloszeniaLines();
    renderPoleceniaLines();

    const kzInput = document.getElementById("kzInput");
    const mkkInput = document.getElementById("mkkInput");

    if (kzInput) kzInput.value = appState.kz || "";
    if (mkkInput) mkkInput.value = appState.mkk || "";

    setupPersistentInputs();
    setDefaultTemplate();
    updateLiveEntry();
}

function setupPersistentInputs() {
    const kzInput = document.getElementById("kzInput");
    const mkkInput = document.getElementById("mkkInput");
    const templateSelect = document.getElementById("templateSelect");

    if (kzInput) {
        kzInput.addEventListener("input", () => {
            appState.kz = kzInput.value;
            saveState();
            updateLiveEntry();
        });
    }
    if (mkkInput) {
        mkkInput.addEventListener("input", () => {
            appState.mkk = mkkInput.value;
            saveState();
            updateLiveEntry();
        });
    }
    if (templateSelect) {
        templateSelect.addEventListener("change", () => {
            updateLiveEntry();
        });
    }
}

function setDefaultTemplate() {
    const select = document.getElementById("templateSelect");
    if (!select) return;

    if (appState.defaultTemplateIndex !== undefined &&
        appState.defaultTemplateIndex < appState.szablony.length) {
        select.value = appState.defaultTemplateIndex;
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
            <div class="select-card-title">${patrol.nazwa || ("Patrol " + (index + 1))}</div>
        </div>`;
    });
    container.innerHTML = html || "<p>Brak utworzonych patroli</p>";
}

function togglePatrol(index) {
    const pos = selectedPatrols.indexOf(index);
    if (pos > -1) selectedPatrols.splice(pos, 1);
    else selectedPatrols.push(index);

    renderPatroleCards();
    updateLiveEntry();
}

// =====================================
// SZABLONY
// =====================================

function renderTemplateList() {
    const select = document.getElementById("templateSelect");
    if (!select) return;

    let html = `<option value="">Wybierz szablon</option>`;
    (appState.szablony || []).forEach((template, index) => {
        html += `<option value="${index}">${template.nazwa || ("Szablon " + (index + 1))}</option>`;
    });
    select.innerHTML = html;
}

// =====================================
// ZGŁOSZENIA (po indeksach!)
// =====================================

function renderZgloszeniaLines() {
    const container = document.getElementById("zgloszeniaLinie");
    if (!container) return;

    let lines = [...new Set((appState.zgloszenia?.rows || []).map(row => row.Linia).filter(Boolean))];
    lines = sortLinesNatural(lines);

    let html = "";
    lines.forEach(line => {
        const hasSelected = (appState.zgloszenia.rows || []).some((row, idx) =>
            row.Linia === line && selectedZgloszeniaIndexes.includes(idx)
        );

        const isActive = selectedZgloszeniaLine === line;
        let className = "line-pill";
        if (isActive) className += " active";
        if (hasSelected) className += " has-selected";

        html += `<div class="${className}" onclick="selectZgloszeniaLine('${escapeAttr(line)}')">${line}</div>`;
    });

    container.innerHTML = html || "<p>Brak zgłoszeń</p>";
}

function selectZgloszeniaLine(line) {
    if (selectedZgloszeniaLine === line) {
        selectedZgloszeniaLine = null;
        const items = document.getElementById("zgloszeniaItems");
        if (items) items.innerHTML = "";
    } else {
        selectedZgloszeniaLine = line;
        renderZgloszeniaItems();
    }
    renderZgloszeniaLines();
}

function renderZgloszeniaItems() {
    const container = document.getElementById("zgloszeniaItems");
    if (!container) return;

    const rows = (appState.zgloszenia?.rows || [])
        .map((row, index) => ({ ...row, _index: index }))
        .filter(row => row.Linia === selectedZgloszeniaLine);

    let html = "";
    rows.forEach(row => {
        const isSelected = selectedZgloszeniaIndexes.includes(row._index);
        const label = (row.Opis || "(bez opisu)").substring(0, 120);
        html += `
        <div class="item-card ${isSelected ? "selected" : ""}"
             onclick="toggleZgloszenie(${row._index})">
            ${label.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        </div>`;
    });

    container.innerHTML = html || "<p>Brak zgłoszeń na tej linii</p>";
}

function toggleZgloszenie(index) {
    const pos = selectedZgloszeniaIndexes.indexOf(index);
    if (pos > -1) selectedZgloszeniaIndexes.splice(pos, 1);
    else selectedZgloszeniaIndexes.push(index);

    renderZgloszeniaItems();
    renderZgloszeniaLines();
    updateLiveEntry();
}

// =====================================
// POLECENIA (po indeksach!)
// =====================================

function renderPoleceniaLines() {
    const container = document.getElementById("poleceniaLinie");
    if (!container) return;

    let lines = [...new Set((appState.polecenia?.rows || []).map(row => row.Linia).filter(Boolean))];
    lines = sortLinesNatural(lines);

    let html = "";
    lines.forEach(line => {
        const hasSelected = (appState.polecenia.rows || []).some((row, idx) =>
            row.Linia === line && selectedPoleceniaIndexes.includes(idx)
        );

        const isActive = selectedPoleceniaLine === line;
        let className = "line-pill";
        if (isActive) className += " active";
        if (hasSelected) className += " has-selected";

        html += `<div class="${className}" onclick="selectPoleceniaLine('${escapeAttr(line)}')">${line}</div>`;
    });

    container.innerHTML = html || "<p>Brak poleceń</p>";
}

function selectPoleceniaLine(line) {
    if (selectedPoleceniaLine === line) {
        selectedPoleceniaLine = null;
        const items = document.getElementById("poleceniaItems");
        if (items) items.innerHTML = "";
    } else {
        selectedPoleceniaLine = line;
        renderPoleceniaItems();
    }
    renderPoleceniaLines();
}

function renderPoleceniaItems() {
    const container = document.getElementById("poleceniaItems");
    if (!container) return;

    const rows = (appState.polecenia?.rows || [])
        .map((row, index) => ({ ...row, _index: index }))
        .filter(row => row.Linia === selectedPoleceniaLine);

    let html = "";
    rows.forEach(row => {
        const isSelected = selectedPoleceniaIndexes.includes(row._index);
        const label = (row.Opis || "(bez opisu)").substring(0, 120);
        html += `
        <div class="item-card ${isSelected ? "selected" : ""}"
             onclick="togglePolecenie(${row._index})">
            ${label.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        </div>`;
    });

    container.innerHTML = html || "<p>Brak poleceń na tej linii</p>";
}

function togglePolecenie(index) {
    const pos = selectedPoleceniaIndexes.indexOf(index);
    if (pos > -1) selectedPoleceniaIndexes.splice(pos, 1);
    else selectedPoleceniaIndexes.push(index);

    renderPoleceniaItems();
    renderPoleceniaLines();
    updateLiveEntry();
}

// =====================================
// GENEROWANIE
// =====================================

function updateLiveEntry() {
    const textarea = document.getElementById("generatedEntry");
    if (!textarea) return;

    if (!selectedPatrols.length) {
        textarea.value = "";
        return;
    }

    const templateSelect = document.getElementById("templateSelect");
    if (!templateSelect || templateSelect.value === "") {
        textarea.value = "";
        return;
    }

    const template = appState.szablony?.[templateSelect.value];
    if (!template) {
        textarea.value = "";
        return;
    }

    const kz = document.getElementById("kzInput")?.value || "";
    const mkk = document.getElementById("mkkInput")?.value || "";

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
            patrol.sklad.forEach(p => {
                if (p) allSklad.push(p);
            });
        }

        if (patrol.dowodca) allDowodcy.push(patrol.dowodca);
        if (patrol.kierowca) allKierowcy.push(patrol.kierowca);
        if (patrol.wot1) allWot.push(patrol.wot1);
        if (patrol.wot2) allWot.push(patrol.wot2);
        if (patrol.policjant1) allPolicjanci.push(patrol.policjant1);
        if (patrol.policjant2) allPolicjanci.push(patrol.policjant2);
    });

    // Opisy wybranych zgłoszeń / poleceń
    const selectedZgloszeniaTexts = selectedZgloszeniaIndexes
        .map(i => appState.zgloszenia?.rows?.[i]?.Opis)
        .filter(Boolean);

    const selectedPoleceniaTexts = selectedPoleceniaIndexes
        .map(i => appState.polecenia?.rows?.[i]?.Opis)
        .filter(Boolean);

    const patrolLine     = forceOneLine(uniqueNonEmpty(patrolNames));
    const skladLine      = forceOneLine(uniqueNonEmpty(allSklad));
    const dowodcaLine    = forceOneLine(uniqueNonEmpty(allDowodcy));
    const kierowcaLine   = forceOneLine(uniqueNonEmpty(allKierowcy));
    const wszyscyLine    = forceOneLine(uniqueNonEmpty([...allSklad, ...allDowodcy, ...allKierowcy]));
    const zgloszeniaLine = forceOneLine(selectedZgloszeniaTexts);
    const poleceniaLine  = forceOneLine(selectedPoleceniaTexts);
    const wotList        = forceOneLine(uniqueNonEmpty(allWot));
    const policjantList  = forceOneLine(uniqueNonEmpty(allPolicjanci));

    const now = new Date();
    const data = now.toLocaleDateString("pl-PL");
    const godzina = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

    let text = template.tresc || "";

    const replacements = {
        "@patrol":     patrolLine,
        "@dowodca":    dowodcaLine,
        "@kierowca":   kierowcaLine,
        "@sklad":      skladLine,
        "@wszyscy":    wszyscyLine,
        "@zgloszenia": zgloszeniaLine,
        "@polecenia":  poleceniaLine,
        "@data":       data,
        "@godzina":    godzina,
        "@KZ":         kz,
        "@MKK":        mkk,
        "@wot":        wotList,
        "@policjant":  policjantList
    };

    // 2 przebiegi: najpierw szablon, potem znaczniki wewnątrz opisów
    for (let pass = 0; pass < 2; pass++) {
        Object.entries(replacements).forEach(([tag, value]) => {
            const safe = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(safe, "gi");
            text = text.replace(regex, value || "");
        });
    }

    text = text.replace(/\n+/g, " ").trim();
    textarea.value = text;
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
    }).catch(() => {
        showToast("Nie udało się skopiować");
    });
}

function clearEntry() {
    const textarea = document.getElementById("generatedEntry");
    if (textarea) textarea.value = "";

    selectedZgloszeniaIndexes = [];
    selectedPoleceniaIndexes = [];
    selectedPatrols = [];
    selectedZgloszeniaLine = null;
    selectedPoleceniaLine = null;

    renderPatroleCards();
    renderZgloszeniaLines();
    renderPoleceniaLines();

    const zItems = document.getElementById("zgloszeniaItems");
    const pItems = document.getElementById("poleceniaItems");
    if (zItems) zItems.innerHTML = "";
    if (pItems) pItems.innerHTML = "";

    updateLiveEntry();
}

function showToast(message) {
    const old = document.getElementById("toastMsg");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.id = "toastMsg";
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #16a34a;
        color: white;
        padding: 14px 22px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        opacity: 0;
        transition: opacity 0.3s ease;
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
window.showToast = showToast;
