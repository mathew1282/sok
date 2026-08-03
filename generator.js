// =====================================
// GENERATOR WPISÓW
// =====================================

let selectedPatrols = [];
let selectedZgloszenia = [];
let selectedPolecenia = [];
let selectedZgloszeniaLine = null;
let selectedPoleceniaLine = null;

// =====================================
// POMOCNICZE FUNKCJE
// =====================================

function forceOneLine(items) {
    if (!items) return "";
    let arr = Array.isArray(items) ? items : String(items).split("\n");
    return arr
        .map(item => String(item || "").trim())
        .filter(item => item.length > 1)
        .join(", ");
}

function getAllPatrolMembersOneLine() {
    const members = new Set();
    appState.patrole.forEach(patrol => {
        if (patrol?.sklad && Array.isArray(patrol.sklad)) {
            patrol.sklad.forEach(person => {
                const name = String(person || "").trim();
                if (name.length > 1) members.add(name);
            });
        }
    });
    return Array.from(members);
}

function sortLinesNatural(lines) {
    return lines.sort((a, b) => {
        const aStr = String(a || "").trim();
        const bStr = String(b || "").trim();

        const aIsNum = /^\d/.test(aStr);
        const bIsNum = /^\d/.test(bStr);

        // Liczby najpierw
        if (aIsNum && !bIsNum) return -1;
        if (!aIsNum && bIsNum) return 1;

        // Oba numeryczne → sortuj numerycznie
        if (aIsNum && bIsNum) {
            const aNum = parseInt(aStr, 10);
            const bNum = parseInt(bStr, 10);
            if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) {
                return aNum - bNum;
            }
        }

        // Alfabetycznie (polski)
        return aStr.localeCompare(bStr, "pl", { numeric: true, sensitivity: "base" });
    });
}

// =====================================
// INICJALIZACJA
// =====================================

function initGenerator() {
    selectedPatrols = [];
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
// PATROLE (dowolna liczba)
// =====================================

function renderPatroleCards() {
    const container = document.getElementById("patrolCards");
    if (!container) return;

    let html = "";
    appState.patrole.forEach((patrol, index) => {
        const isSelected = selectedPatrols.includes(index) ? "active" : "";
        html += `
        <div class="select-card ${isSelected}" onclick="togglePatrol(${index})">
            <div class="select-card-title">${patrol.nazwa}</div>
        </div>`;
    });
    container.innerHTML = html || "<p>Brak utworzonych patroli</p>";
}

function togglePatrol(index) {
    const pos = selectedPatrols.indexOf(index);

    if (pos > -1) {
        selectedPatrols.splice(pos, 1);
    } else {
        selectedPatrols.push(index);
    }

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
    appState.szablony.forEach((template, index) => {
        html += `<option value="${index}">${template.nazwa}</option>`;
    });
    select.innerHTML = html;
}

// =====================================
// ZGŁOSZENIA
// =====================================

function renderZgloszeniaLines() {
    const container = document.getElementById("zgloszeniaLinie");
    if (!container) return;

    let lines = [...new Set(appState.zgloszenia.rows.map(row => row.Linia).filter(Boolean))];
    lines = sortLinesNatural(lines);

    let html = "";
    lines.forEach(line => {
        const hasSelected = appState.zgloszenia.rows
            .filter(row => row.Linia === line)
            .some(row => selectedZgloszenia.includes(row.Opis));

        const isActive = selectedZgloszeniaLine === line;
        let className = "line-pill";
        if (isActive) className += " active";
        if (hasSelected) className += " has-selected";

        html += `<div class="${className}" onclick="selectZgloszeniaLine('${line}')">${line}</div>`;
    });

    container.innerHTML = html || "<p>Brak zgłoszeń</p>";
}

function selectZgloszeniaLine(line) {
    selectedZgloszeniaLine = line;
    renderZgloszeniaItems();
    renderZgloszeniaLines();
}

function renderZgloszeniaItems() {
    const container = document.getElementById("zgloszeniaItems");
    if (!container) return;
    const rows = appState.zgloszenia.rows.filter(row => row.Linia === selectedZgloszeniaLine);
    let html = "";
    rows.forEach(row => {
        const isSelected = selectedZgloszenia.includes(row.Opis);
        html += `<div class="item-card ${isSelected ? 'selected' : ''}" onclick="toggleZgloszenie('${row.Opis.replace(/'/g, "\\'")}')">${row.Opis}</div>`;
    });
    container.innerHTML = html || "<p>Brak zgłoszeń na tej linii</p>";
}

function toggleZgloszenie(opis) {
    const index = selectedZgloszenia.indexOf(opis);
    if (index > -1) selectedZgloszenia.splice(index, 1);
    else selectedZgloszenia.push(opis);
    renderZgloszeniaItems();
    renderZgloszeniaLines();
    updateLiveEntry();
}

// =====================================
// POLECENIA
// =====================================

function renderPoleceniaLines() {
    const container = document.getElementById("poleceniaLinie");
    if (!container) return;

    let lines = [...new Set(appState.polecenia.rows.map(row => row.Linia).filter(Boolean))];
    lines = sortLinesNatural(lines);

    let html = "";
    lines.forEach(line => {
        const hasSelected = appState.polecenia.rows
            .filter(row => row.Linia === line)
            .some(row => selectedPolecenia.includes(row.Opis));

        const isActive = selectedPoleceniaLine === line;
        let className = "line-pill";
        if (isActive) className += " active";
        if (hasSelected) className += " has-selected";

        html += `<div class="${className}" onclick="selectPoleceniaLine('${line}')">${line}</div>`;
    });

    container.innerHTML = html || "<p>Brak poleceń</p>";
}

function selectPoleceniaLine(line) {
    selectedPoleceniaLine = line;
    renderPoleceniaItems();
    renderPoleceniaLines();
}

function renderPoleceniaItems() {
    const container = document.getElementById("poleceniaItems");
    if (!container) return;
    const rows = appState.polecenia.rows.filter(row => row.Linia === selectedPoleceniaLine);
    let html = "";
    rows.forEach(row => {
        const isSelected = selectedPolecenia.includes(row.Opis);
        html += `<div class="item-card ${isSelected ? 'selected' : ''}" onclick="togglePolecenie('${row.Opis.replace(/'/g, "\\'")}')">${row.Opis}</div>`;
    });
    container.innerHTML = html || "<p>Brak poleceń na tej linii</p>";
}

function togglePolecenie(opis) {
    const index = selectedPolecenia.indexOf(opis);
    if (index > -1) selectedPolecenia.splice(index, 1);
    else selectedPolecenia.push(opis);
    renderPoleceniaItems();
    renderPoleceniaLines();
    updateLiveEntry();
}

// =====================================
// GENEROWANIE NA ŻYWO
// =====================================

function updateLiveEntry() {
    const textarea = document.getElementById("generatedEntry");
    if (!textarea) return;

    if (selectedPatrols.length === 0) {
        textarea.value = "";
        return;
    }

    const templateSelect = document.getElementById("templateSelect");
    if (!templateSelect || templateSelect.value === "") {
        textarea.value = "";
        return;
    }

    const template = appState.szablony[templateSelect.value];
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
        const patrol = appState.patrole[index];
        if (!patrol) return;

        patrolNames.push(patrol.nazwa || "");
        if (patrol.sklad) allSklad.push(...patrol.sklad);
        if (patrol.dowodca) allDowodcy.push(patrol.dowodca);
        if (patrol.kierowca) allKierowcy.push(patrol.kierowca);
        if (patrol.wot1) allWot.push(patrol.wot1);
        if (patrol.wot2) allWot.push(patrol.wot2);
        if (patrol.policjant1) allPolicjanci.push(patrol.policjant1);
        if (patrol.policjant2) allPolicjanci.push(patrol.policjant2);
    });

    let text = template.tresc || "";

    const skladLine = forceOneLine(allSklad);
    const wszyscyLine = forceOneLine(getAllPatrolMembersOneLine());
    const zgloszeniaLine = forceOneLine(selectedZgloszenia);
    const poleceniaLine = forceOneLine(selectedPolecenia);
    const wotList = forceOneLine(allWot);
    const policjantList = forceOneLine(allPolicjanci);

    const now = new Date();
    const data = now.toLocaleDateString("pl-PL");
    const godzina = now.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' });

    text = text.replaceAll("@patrol", forceOneLine(patrolNames));
    text = text.replaceAll("@dowodca", forceOneLine(allDowodcy));
    text = text.replaceAll("@kierowca", forceOneLine(allKierowcy));
    text = text.replaceAll("@sklad", skladLine);
    text = text.replaceAll("@wszyscy", wszyscyLine);
    text = text.replaceAll("@zgloszenia", zgloszeniaLine);
    text = text.replaceAll("@polecenia", poleceniaLine);
    text = text.replaceAll("@data", data);
    text = text.replaceAll("@godzina", godzina);
    text = text.replaceAll("@KZ", kz);
    text = text.replaceAll("@MKK", mkk);
    text = text.replaceAll("@wot", wotList);
    text = text.replaceAll("@policjant", policjantList);

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
    document.getElementById("generatedEntry").value = "";
    selectedZgloszenia = [];
    selectedPolecenia = [];
    selectedPatrols = [];
    renderPatroleCards();
    renderZgloszeniaItems();
    renderPoleceniaItems();
    renderZgloszeniaLines();
    renderPoleceniaLines();
    updateLiveEntry();
}

// =====================================
// MAŁE POWIADOMIENIE (toast)
// =====================================
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
// EXPOSE FUNKCJI
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
