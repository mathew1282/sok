// =====================================
// GENERATOR WPISÓW
// + autofilt linii
// + sort alfabetyczny 2. poziomu
// + UWAGI (TAK / NIE)
// + @wybrani w uwagach
// =====================================

let selectedPatrols = [];
let selectedZgloszeniaIndexes = [];
let selectedPoleceniaIndexes = [];
let selectedZgloszeniaLine = null;
let selectedPoleceniaLine = null;
let selectedWybrani = [];
let uwagiWybrane = "NIE";

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
    const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.Opis || ""}`.toLowerCase();
    return t.includes(search);
}

function sortByOpisKrotki(rows) {
    return rows.sort((a, b) => {
        const aLabel = (a.OpisKrotki || a.Opis || "").toLowerCase();
        const bLabel = (b.OpisKrotki || b.Opis || "").toLowerCase();
        return aLabel.localeCompare(bLabel, "pl", { sensitivity: "base", numeric: true });
    });
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
    selectedWybrani = [];
    uwagiWybrane = "NIE";

    ensureUwagiState();

    if (!appState.zgloszenia) appState.zgloszenia = { columns: ["Linia", "OpisKrotki", "Opis"], rows: [] };
    if (!Array.isArray(appState.zgloszenia.rows)) appState.zgloszenia.rows = [];
    if (!appState.polecenia) appState.polecenia = { columns: ["Linia", "OpisKrotki", "Opis"], rows: [] };
    if (!Array.isArray(appState.polecenia.rows)) appState.polecenia.rows = [];
    if (!Array.isArray(appState.patrole)) appState.patrole = [];

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
    selectedWybrani = [];
    renderPatroleCards();
    updateLiveEntry();
}

// =====================================
// ZGŁOSZENIA
// =====================================

function renderZgloszeniaLines() {
    const container = document.getElementById("zgloszeniaLinie");
    if (!container) return;

    const search = getZglSearch();
    const allRows = appState.zgloszenia?.rows || [];

    let lines = [...new Set(
        allRows
            .filter(row => rowMatchesSearch(row, search))
            .map(r => r.Linia)
            .filter(Boolean)
    )];
    lines = sortLinesNatural(lines);

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
    selectedZgloszeniaLine = (selectedZgloszeniaLine === line) ? null : line;
    renderZgloszeniaLines();
}

function renderZgloszeniaItems() {
    const container = document.getElementById("zgloszeniaItems");
    if (!container) return;

    const search = getZglSearch();
    const allRows = appState.zgloszenia?.rows || [];

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));

    if (selectedZgloszeniaLine) {
        rows = rows.filter(row => row.Linia === selectedZgloszeniaLine);
    }

    if (search) {
        rows = rows.filter(row => rowMatchesSearch(row, search));
    }

    if (!selectedZgloszeniaLine && !search) {
        container.innerHTML = "";
        return;
    }

    sortByOpisKrotki(rows);

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

    const search = getPolSearch();
    const allRows = appState.polecenia?.rows || [];

    let lines = [...new Set(
        allRows
            .filter(row => rowMatchesSearch(row, search))
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
    selectedPoleceniaLine = (selectedPoleceniaLine === line) ? null : line;
    renderPoleceniaLines();
}

function renderPoleceniaItems() {
    const container = document.getElementById("poleceniaItems");
    if (!container) return;

    const search = getPolSearch();
    const allRows = appState.polecenia?.rows || [];

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));

    if (selectedPoleceniaLine) {
        rows = rows.filter(row => row.Linia === selectedPoleceniaLine);
    }

    if (search) {
        rows = rows.filter(row => rowMatchesSearch(row, search));
    }

    if (!selectedPoleceniaLine && !search) {
        container.innerHTML = "";
        return;
    }

    sortByOpisKrotki(rows);

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
}

// =====================================
// MODAL UWAGI
// =====================================

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
    document.getElementById("uwagiTekst").value = "";
    document.getElementById("uwagiModal").style.display = "flex";
}

function closeUwagiModal() {
    const m = document.getElementById("uwagiModal");
    if (m) m.style.display = "none";
}

function wybierzTypUwagi(typ) {
    ensureUwagiState();
    const tekst = appState.uwagiSzablony[typ] || "";
    const textarea = document.getElementById("uwagiTekst");
    if (textarea) {
        const replacements = buildReplacements();
        textarea.value = applyTags(tekst, replacements);
    }
}

// =====================================
// SZABLONY UWAG
// =====================================

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
                Edytuj szablony. Możesz używać wszystkich znaczników:<br>
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
    showToast("✅ Szablony uwag zapisane");
}

// =====================================
// WSTAWIANIE UWAGI (+ obsługa @wybrani)
// =====================================

function wstawUwagi() {
    const tekst = (document.getElementById("uwagiTekst")?.value || "").trim();
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
        openWybraniModalForUwagi();
        return;
    }

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
        list.parentNode.insertBefore(preview, actions);
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
    wstawTekstUwagiDoWpis(gotowyTekst);

    const actions = document.querySelector("#wybraniModal .modal-actions");
    if (actions) {
        actions.innerHTML = `
            <button class="btn-success" onclick="confirmWybrani()">Zatwierdź i generuj</button>
            <button class="btn-primary" onclick="selectAllWybrani()">Zaznacz wszystkich</button>
            <button class="btn-danger" onclick="closeWybraniModal()">Anuluj</button>
        `;
    }

    const preview = document.getElementById("uwagiLivePreview");
    if (preview) preview.remove();
}

// =====================================
// GENEROWANIE
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
    const zgloszeniaParts = selectedZgloszeniaIndexes
        .map(i => appState.zgloszenia?.rows?.[i]?.Opis || "");
    const poleceniaParts = selectedPoleceniaIndexes
        .map(i => appState.polecenia?.rows?.[i]?.Opis || "");
    const allTexts = [...zgloszeniaParts, ...poleceniaParts].join(" ");
    return /@wybrani/i.test(allTexts);
}

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

    const wybraniValue = selectedWybrani.length > 0
        ? forceOneLine(uniqueNonEmpty(selectedWybrani))
        : "";

    return {
        "@patrol":     forceOneLine(uniqueNonEmpty(patrolNames)),
        "@dowodca":    forceOneLine(uniqueNonEmpty(allDowodcy)),
        "@kierowca":   forceOneLine(uniqueNonEmpty(allKierowcy)),
        "@sklad":      forceOneLine(uniqueNonEmpty(allSklad)),
        "@wszyscy":    forceOneLine(uniqueNonEmpty([...allSklad, ...allDowodcy, ...allKierowcy])),
        "@wybrani":    wybraniValue,
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
    const banner = document.getElementById("wybraniHintBanner");
    if (!textarea) return;

    const replacements = buildReplacements();
    const needsWybraniHint = hasWybraniTag() && selectedWybrani.length === 0;
    const hintPlain = "⚠ KLIKNIJ „GENERUJ WPIS”, ABY WYBRAĆ OSOBY";

    const replacementsForApply = { ...replacements };
    if (needsWybraniHint) {
        replacementsForApply["@wybrani"] = hintPlain;
    }

    const zgloszeniaParts = selectedZgloszeniaIndexes
        .map(i => appState.zgloszenia?.rows?.[i]?.Opis)
        .filter(Boolean)
        .map(t => applyTags(t, replacementsForApply));

    const poleceniaParts = selectedPoleceniaIndexes
        .map(i => appState.polecenia?.rows?.[i]?.Opis)
        .filter(Boolean)
        .map(t => applyTags(t, replacementsForApply));

    textarea.value = [...zgloszeniaParts, ...poleceniaParts].filter(Boolean).join(" ");

    if (banner) {
        banner.style.display = needsWybraniHint ? "block" : "none";
    }
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
                Możesz wybrać jedną, kilka lub wszystkich.
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

    const cards = document.querySelectorAll("#wybraniList .item-card");
    cards.forEach((card, i) => {
        const n = people[i];
        if (selectedWybrani.includes(n)) card.classList.add("selected");
        else card.classList.remove("selected");
    });
}

function selectAllWybrani() {
    selectedWybrani = [...getSkladFromSelectedPatrols()];
    const cards = document.querySelectorAll("#wybraniList .item-card");
    cards.forEach(card => card.classList.add("selected"));
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
    updateLiveEntry();

    if (uwagiWybrane === "TAK") {
        openUwagiModal();
    } else {
        showToast("✅ Wpis wygenerowany z wybranymi osobami");
    }
}

// =====================================
// PRZYCISKI
// =====================================

function generateEntry() {
    if (hasWybraniTag()) {
        const opened = openWybraniModal();
        if (!opened) {
            selectedWybrani = [];
            updateLiveEntry();
            if (uwagiWybrane === "TAK") openUwagiModal();
        }
        return;
    }

    selectedWybrani = [];
    updateLiveEntry();

    if (uwagiWybrane === "TAK") {
        openUwagiModal();
    }
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
    selectedWybrani = [];
    uwagiWybrane = "NIE";

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
window.toggleWybranaOsoba = toggleWybranaOsoba;
window.selectAllWybrani = selectAllWybrani;
window.confirmWybrani = confirmWybrani;
window.closeWybraniModal = closeWybraniModal;

// Uwagi
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
