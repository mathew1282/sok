document.addEventListener("DOMContentLoaded", () => {

    const saveDataBtn = document.getElementById("saveDataBtn");
    const loadDataBtn = document.getElementById("loadDataBtn");
    const jsonLoader = document.getElementById("jsonLoader");

    if (saveDataBtn) saveDataBtn.addEventListener("click", exportToJSON);
    if (loadDataBtn) loadDataBtn.addEventListener("click", () => jsonLoader.click());
    if (jsonLoader) jsonLoader.addEventListener("change", importFromJSON);

    // Menu
    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const page = btn.dataset.page;
            loadPage(page);

            document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Start dopiero po wczytaniu danych
    if (window.__sokStateReady) {
        startApp();
    } else {
        window.addEventListener("sokStateLoaded", startApp, { once: true });
        // awaryjnie po 2s i tak odpal
        setTimeout(() => {
            if (!window.__sokStarted) startApp();
        }, 2000);
    }
});

function startApp() {
    if (window.__sokStarted) return;
    window.__sokStarted = true;
    loadPage("generator");
}

// ======================================
// Wbudowane strony
// ======================================

const pages = {
    dane: `<div id="daneContainer"></div>`,
    zgloszenia: `<div id="zgloszeniaContainer"></div>`,
    polecenia: `<div id="poleceniaContainer"></div>`,
    patrole: `<div id="patroleContainer"></div>`,
    szablony: `<div id="szablonyContainer"></div>`,
    generator: `
    <div id="generatorContainer">

        <div class="generator-section" style="display:flex; align-items:center; gap:15px; flex-wrap:wrap;">
            <div class="generator-title" style="margin-bottom:0; white-space:nowrap;">Komendant zmiany IOK Wrocław</div>
            <input type="text" id="kzInput" placeholder="Wpisz KZ" style="flex:1; min-width:200px;">
        </div>

        <div class="generator-section">
            <div class="generator-title">Patrole</div>
            <div id="patrolCards" class="card-grid"></div>
        </div>

        <div class="generator-section" style="display:flex; align-items:center; gap:15px; flex-wrap:wrap;">
            <div class="generator-title" style="margin-bottom:0; white-space:nowrap;">Szablon</div>
            <select id="templateSelect" style="flex:1; min-width:200px;">
                <option value="">Wybierz szablon</option>
            </select>
        </div>

        <div class="generator-section">
            <div class="generator-title">Zgłoszenia</div>
            <div id="zgloszeniaLinie" class="card-grid"></div>
            <br>
            <div id="zgloszeniaItems" class="card-grid"></div>
        </div>

        <div class="generator-section">
            <div class="generator-title">Polecenia</div>
            <div id="poleceniaLinie" class="card-grid"></div>
            <br>
            <div id="poleceniaItems" class="card-grid"></div>
        </div>

        <div class="generator-section" style="display:flex; align-items:center; gap:15px; flex-wrap:wrap;">
            <div class="generator-title" style="margin-bottom:0; white-space:nowrap;">MKK</div>
            <input type="text" id="mkkInput" placeholder="Wpisz MKK" style="flex:1; min-width:200px;">
        </div>

        <div class="generator-section">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <div class="generator-title" style="margin-bottom:0;">Generowanie wpisu</div>
                <button class="btn-success" onclick="generateEntry()">Generuj wpis</button>
                <button class="btn-primary" onclick="copyEntry()">Kopiuj</button>
                <button class="btn-danger" onclick="clearEntry()">Wyczyść</button>
            </div>
        </div>

        <div class="generator-section">
            <div class="generator-title">Wygenerowany wpis</div>
            <textarea id="generatedEntry" style="width:100%; min-height:350px;"></textarea>
        </div>
    </div>`,
    linie: `<div id="linieContainer"></div>`
};

function loadPage(page) {
    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = pages[page] || `<h2>Strona nie znaleziona</h2>`;

    switch (page) {
        case "dane":       if (typeof initDane === "function") initDane(); break;
        case "zgloszenia": if (typeof initZgloszenia === "function") initZgloszenia(); break;
        case "polecenia":  if (typeof initPolecenia === "function") initPolecenia(); break;
        case "patrole":    if (typeof initPatrole === "function") initPatrole(); break;
        case "szablony":   if (typeof initSzablony === "function") initSzablony(); break;
        case "generator":  if (typeof initGenerator === "function") initGenerator(); break;
        case "linie":      if (typeof initLinie === "function") initLinie(); break;
    }
}

// ======================================
// EKSPORT / IMPORT
// ======================================

function exportToJSON() {
    const dataStr = JSON.stringify(appState, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `sok_legnica_${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    alert("Dane wyeksportowane!");
}

function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm("Nadpisać obecne dane?")) {
                appState = { ...defaultState, ...importedData };
                if (!Array.isArray(appState.patrole)) appState.patrole = [];
                if (!Array.isArray(appState.szablony)) appState.szablony = [];
                saveState();
                alert("Dane wczytane!");
                const activeBtn = document.querySelector(".menu-btn.active");
                if (activeBtn) loadPage(activeBtn.dataset.page);
                else loadPage("generator");
            }
        } catch (error) {
            alert("Błąd pliku JSON: " + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}
