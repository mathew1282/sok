let selectedZgloszenia = [];
let selectedPolecenia = [];

// =====================================
// GENERATOR WPISÓW
// =====================================

let selectedPatrol = null;
let selectedZgloszeniaLine = null;
let selectedPoleceniaLine = null;

// =====================================
// FORMATOWANIE - JEDNA LINIA
// =====================================

function forceOneLine(items) {
    if (!items) return "";
    
    let arr = Array.isArray(items) ? items : String(items).split("\n");
    
    return arr
        .map(item => String(item || "").trim())
        .filter(item => item.length > 1)
        .join(", ");
}

// =====================================
// WSZYSCY Z PATROLI
// =====================================

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

// =====================================
// START
// =====================================

function initGenerator() {
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
}

function setupPersistentInputs() {
    const kzInput = document.getElementById("kzInput");
    const mkkInput = document.getElementById("mkkInput");

    if (kzInput) kzInput.addEventListener("input", () => { appState.kz = kzInput.value; saveState(); });
    if (mkkInput) mkkInput.addEventListener("input", () => { appState.mkk = mkkInput.value; saveState(); });
}

// =====================================
// DOMYŚLNY SZABLON
// =====================================

function setDefaultTemplate() {
    const select = document.getElementById("templateSelect");
    if (!select) return;

    if (appState.defaultTemplateIndex !== undefined && 
        appState.defaultTemplateIndex < appState.szablony.length) {
        select.value = appState.defaultTemplateIndex;
    } else if (appState.szablony.length > 0) {
        select.value = 0;
        appState.defaultTemplateIndex = 0;
        saveState();
    }
}

// =====================================
// PATROLE
// =====================================

function renderPatroleCards() {
    const container = document.getElementById("patrolCards");
    if (!container) return;

    let html = "";
    appState.patrole.forEach((patrol, index) => {
        html += `
        <div class="select-card" onclick="selectPatrol(${index})">
            <div class="select-card-title">${patrol.nazwa}</div>
        </div>`;
    });
    container.innerHTML = html || "<p>Brak utworzonych patroli</p>";
}

function selectPatrol(index) {
    selectedPatrol = index;
    renderPatrolPreview();

    document.querySelectorAll("#patrolCards .select-card").forEach(card => card.classList.remove("active"));
    const cards = document.querySelectorAll("#patrolCards .select-card");
    if (cards[index]) cards[index].classList.add("active");
}

function renderPatrolPreview() {
    const preview = document.getElementById("patrolPreview");
    if (selectedPatrol === null) {
        preview.innerHTML = "Wybierz patrol...";
        return;
    }
    const patrol = appState.patrole[selectedPatrol];
    preview.innerHTML = `
        <div class="patrol-header">
            <span>Wybrany patrol:</span>
            <span class="patrol-name">${patrol.nazwa}</span>
            <span class="patrol-dowodca">Dowódca: ${patrol.dowodca || "-"}</span>
            <span class="patrol-kierowca">Kierowca: ${patrol.kierowca || "-"}</span>
        </div>`;
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

    setDefaultTemplate();

    select.addEventListener("change", () => {
        if (select.value !== "") {
            appState.defaultTemplateIndex = parseInt(select.value);
            saveState();
        }
    });
}

// =====================================
// ZGŁOSZENIA
// =====================================

function renderZgloszeniaLines() {
    const container = document.getElementById("zgloszeniaLinie");
    if (!container) return;
    const lines = [...new Set(appState.zgloszenia.rows.map(row => row.Linia))];
    let html = "";
    lines.forEach(line => {
        if (line) html += `<div class="line-pill" onclick="selectZgloszeniaLine('${line}')">${line}</div>`;
    });
    container.innerHTML = html || "<p>Brak zgłoszeń</p>";
}

function selectZgloszeniaLine(line) {
    selectedZgloszeniaLine = line;
    renderZgloszeniaItems();
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
}

// =====================================
// POLECENIA
// =====================================

function renderPoleceniaLines() {
    const container = document.getElementById("poleceniaLinie");
    if (!container) return;
    const lines = [...new Set(appState.polecenia.rows.map(row => row.Linia))];
    let html = "";
    lines.forEach(line => {
        if (line) html += `<div class="line-pill" onclick="selectPoleceniaLine('${line}')">${line}</div>`;
    });
    container.innerHTML = html || "<p>Brak poleceń</p>";
}

function selectPoleceniaLine(line) {
    selectedPoleceniaLine = line;
    renderPoleceniaItems();
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
}

// =====================================
// GENEROWANIE - z automatycznym odznaczaniem
// =====================================

function generateEntry() {
    if (selectedPatrol === null) {
        alert("Wybierz patrol");
        return;
    }

    const templateIndex = document.getElementById("templateSelect").value;
    if (templateIndex === "") {
        alert("Wybierz szablon");
        return;
    }

    const template = appState.szablony[templateIndex];
    const kz = document.getElementById("kzInput")?.value || "";
    const mkk = document.getElementById("mkkInput")?.value || "";
    const patrol = appState.patrole[selectedPatrol];

    let text = template.tresc;

    const skladLine     = forceOneLine(patrol.sklad || []);
    const wszyscyLine   = forceOneLine(getAllPatrolMembersOneLine());
    const zgloszeniaLine = forceOneLine(selectedZgloszenia);
    const poleceniaLine  = forceOneLine(selectedPolecenia);

    const now = new Date();
    const data = now.toLocaleDateString("pl-PL");
    const godzina = now.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' });

    text = text.replaceAll("@patrol", patrol.nazwa || "");
    text = text.replaceAll("@dowodca", patrol.dowodca || "");
    text = text.replaceAll("@kierowca", patrol.kierowca || "");
    text = text.replaceAll("@sklad", skladLine);
    text = text.replaceAll("@wszyscy", wszyscyLine);
    text = text.replaceAll("@zgloszenia", zgloszeniaLine);
    text = text.replaceAll("@polecenia", poleceniaLine);
    text = text.replaceAll("@data", data);
    text = text.replaceAll("@godzina", godzina);
    text = text.replaceAll("@KZ", kz);
    text = text.replaceAll("@MKK", mkk);

    text = text.replace(/\n+/g, " ").trim();

    document.getElementById("generatedEntry").value = text;

    // === AUTOMATYCZNE ODZNACZANIE PO GENEROWANIU ===
    selectedZgloszenia = [];
    selectedPolecenia = [];
    renderZgloszeniaItems();
    renderPoleceniaItems();
}

// =====================================
// KOPIUJ + TOAST
// =====================================

function copyEntry() {
    const textarea = document.getElementById("generatedEntry");
    if (!textarea.value.trim()) {
        showToast("Najpierw wygeneruj wpis", "warning");
        return;
    }
    navigator.clipboard.writeText(textarea.value).then(() => {
        showToast("✅ Skopiowano do schowka");
    });
}

function clearEntry() {
    document.getElementById("generatedEntry").value = "";
    selectedZgloszenia = [];
    selectedPolecenia = [];
    renderZgloszeniaItems();
    renderPoleceniaItems();
}

function saveToKsiazka() {
    alert("Funkcja zapisu do Książki wydarzeń będzie dostępna wkrótce");
}

function showToast(message, type = "success") {
    let toast = document.getElementById("customToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "customToast";
        toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:8px;color:white;font-weight:600;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:all 0.3s ease;`;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background = type === "success" ? "#16a34a" : "#eab308";
    toast.style.opacity = "1";
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 1400);
}