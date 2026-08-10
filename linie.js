// =====================================
// LINIE KOLEJOWE
// - teren: jak dotychczas (Szlak / Osobowa / Towarowa)
// - stacjonarny: 1 linia na osobę (Dyżurny zmiany / Komendant)
// =====================================

// stan UI (nie zapisywany na stałe – tylko w sesji)
let liniePatrolModes = {};      // { [patrolIndex]: "teren" | "stacjonarny" }
let liniePersonRoles = {};      // { [patrolIndex + "|" + personName]: "dyzurny" | "komendant" }

function initLinie() {
    if (!appState.linie) {
        appState.linie = {
            szlak: "",
            osobowa: "",
            towarowa: "",
            dyzurny: "",
            komendant: ""
        };
    }
    // migracja starych danych
    if (appState.linie.dyzurny === undefined) appState.linie.dyzurny = "";
    if (appState.linie.komendant === undefined) appState.linie.komendant = "";

    renderLinie();
}

function renderLinie() {
    const container = document.getElementById("linieContainer");
    if (!container) return;

    const today = new Date().toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    const patrole = appState.patrole || [];

    let html = `
    <div class="card">
        <h2>🚉 Linie kolejowe</h2>

        <h3 style="margin-top:25px;">Numery linii kolejowych</h3>
        <table style="width:100%; border-collapse:collapse; margin-bottom:30px;">
            <thead>
                <tr>
                    <th style="width:40%; text-align:left; padding:12px; background:#1e2937; color:white;">Opis</th>
                    <th style="text-align:left; padding:12px; background:#1e2937; color:white;">Numer linii</th>
                </tr>
            </thead>
            <tbody>
                <tr style="background:#1e40af; color:white;">
                    <td style="padding:14px; font-weight:600;">Szlak</td>
                    <td style="padding:14px;">
                        <input type="text" value="${escapeHtml(appState.linie?.szlak || "")}"
                               onchange="saveLine('szlak', this.value)"
                               placeholder="np. 274"
                               style="width:100%; padding:10px; font-size:16px; color:#0f172a; background:#fff;">
                    </td>
                </tr>
                <tr style="background:#166534; color:white;">
                    <td style="padding:14px; font-weight:600;">Osobowa</td>
                    <td style="padding:14px;">
                        <input type="text" value="${escapeHtml(appState.linie?.osobowa || "")}"
                               onchange="saveLine('osobowa', this.value)"
                               placeholder="np. 275"
                               style="width:100%; padding:10px; font-size:16px; color:#0f172a; background:#fff;">
                    </td>
                </tr>
                <tr style="background:#854d0e; color:white;">
                    <td style="padding:14px; font-weight:600;">Towarowa</td>
                    <td style="padding:14px;">
                        <input type="text" value="${escapeHtml(appState.linie?.towarowa || "")}"
                               onchange="saveLine('towarowa', this.value)"
                               placeholder="np. 276"
                               style="width:100%; padding:10px; font-size:16px; color:#0f172a; background:#fff;">
                    </td>
                </tr>
                <tr style="background:#7c3aed; color:white;">
                    <td style="padding:14px; font-weight:600;">Dyżurny zmiany</td>
                    <td style="padding:14px;">
                        <input type="text" value="${escapeHtml(appState.linie?.dyzurny || "")}"
                               onchange="saveLine('dyzurny', this.value)"
                               placeholder="np. numer linii dyżurnego"
                               style="width:100%; padding:10px; font-size:16px; color:#0f172a; background:#fff;">
                    </td>
                </tr>
                <tr style="background:#be185d; color:white;">
                    <td style="padding:14px; font-weight:600;">Komendant</td>
                    <td style="padding:14px;">
                        <input type="text" value="${escapeHtml(appState.linie?.komendant || "")}"
                               onchange="saveLine('komendant', this.value)"
                               placeholder="np. numer linii komendanta"
                               style="width:100%; padding:10px; font-size:16px; color:#0f172a; background:#fff;">
                    </td>
                </tr>
            </tbody>
        </table>

        <h3>Patrole – wybór trybu</h3>
        <p style="color:#94a3b8; margin-bottom:15px; font-size:14px;">
            Dla każdego patrolu wybierz: <strong>Patrol w terenie</strong> (jak dotychczas – 3 linie)
            albo <strong>Patrol stacjonarny</strong> (przy osobach: Dyżurny / Komendant – jedna linia).
        </p>
    `;

    if (patrole.length === 0) {
        html += `<p style="color:#f87171;">Brak patroli. Utwórz je w zakładce „Patrole”.</p>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:12px; margin-bottom:30px;">`;

        patrole.forEach((patrol, index) => {
            const mode = liniePatrolModes[index] || "";
            const people = getPatrolPeopleList(patrol);

            html += `
            <div style="border:1px solid #334155; border-radius:10px; padding:16px; background:#0f172a;">
                <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:10px;">
                    <div style="font-weight:700; font-size:16px; min-width:160px;">${escapeHtml(patrol.nazwa || ("Patrol " + (index + 1)))}</div>
                    <button type="button"
                        class="btn-primary ${mode === "teren" ? "active" : ""}"
                        style="${mode === "teren" ? "outline:2px solid #22c55e;" : ""}"
                        onclick="setLiniePatrolMode(${index}, 'teren')">
                        🚓 Patrol w terenie
                    </button>
                    <button type="button"
                        class="btn-primary ${mode === "stacjonarny" ? "active" : ""}"
                        style="${mode === "stacjonarny" ? "outline:2px solid #a78bfa;" : ""}"
                        onclick="setLiniePatrolMode(${index}, 'stacjonarny')">
                        🏢 Patrol stacjonarny
                    </button>
                    ${mode ? `<button type="button" class="btn-danger" onclick="setLiniePatrolMode(${index}, '')">Odznacz</button>` : ""}
                </div>
                <div style="color:#94a3b8; font-size:13px; margin-bottom:8px;">
                    Skład: ${people.length ? people.map(p => escapeHtml(p)).join(", ") : "—"}
                </div>
            `;

            // dla stacjonarnego – wybór roli przy każdej osobie
            if (mode === "stacjonarny") {
                if (people.length === 0) {
                    html += `<p style="color:#f87171;">Brak osób w składzie tego patrolu.</p>`;
                } else {
                    html += `<div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">`;
                    people.forEach(personName => {
                        const key = personRoleKey(index, personName);
                        const role = liniePersonRoles[key] || "";
                        html += `
                        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; padding:8px 10px; background:#1e293b; border-radius:8px;">
                            <span style="min-width:200px; font-weight:600;">${escapeHtml(personName)}</span>
                            <button type="button" class="btn-primary"
                                style="${role === "dyzurny" ? "outline:2px solid #a78bfa; background:#7c3aed;" : ""}"
                                onclick="setLiniePersonRole(${index}, '${escapeAttr(personName)}', 'dyzurny')">
                                Dyżurny zmiany
                            </button>
                            <button type="button" class="btn-primary"
                                style="${role === "komendant" ? "outline:2px solid #f472b6; background:#be185d;" : ""}"
                                onclick="setLiniePersonRole(${index}, '${escapeAttr(personName)}', 'komendant')">
                                Komendant
                            </button>
                        </div>`;
                    });
                    html += `</div>`;
                }
            }

            html += `</div>`;
        });

        html += `</div>`;
    }

    // ===== PODGLĄD TABEL =====
    html += `
        <h3>Tabele do Excela</h3>
        <button onclick="copyAllTables()" class="btn-primary" style="padding:12px 24px; font-size:16px; margin-bottom:20px;">
            📋 Kopiuj WSZYSTKIE tabele do Excela
        </button>
        <div id="linieTablesArea">
    `;

    const tablesHtml = buildAllPersonTables(today);
    if (!tablesHtml) {
        html += `<p style="color:#94a3b8;">Wybierz tryb patrolu powyżej, aby wygenerować tabele.</p>`;
    } else {
        html += tablesHtml;
    }

    html += `
        </div>
    </div>`;

    container.innerHTML = html;
}

// ==============================================
// POMOCNICZE
// ==============================================

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
    return String(str || "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
}

function personRoleKey(patrolIndex, personName) {
    return patrolIndex + "|" + personName;
}

function getPatrolPeopleList(patrol) {
    const set = new Set();
    if (Array.isArray(patrol.sklad)) {
        patrol.sklad.forEach(n => { if (n && String(n).trim()) set.add(String(n).trim()); });
    }
    if (patrol.dowodca && String(patrol.dowodca).trim()) set.add(String(patrol.dowodca).trim());
    if (patrol.kierowca && String(patrol.kierowca).trim()) set.add(String(patrol.kierowca).trim());
    return Array.from(set);
}

function getNrPLK(fullName) {
    if (!appState.dane || !appState.dane.rows) return "";

    for (let row of appState.dane.rows) {
        const rowName = `${row["Stopień"] || ""} ${row["Nazwisko"] || ""} ${row["Imię"] || ""}`.trim();
        const shortName = `${row["Nazwisko"] || ""} ${row["Imię"] || ""}`.trim();
        if (rowName === fullName || shortName === fullName) {
            return row["NrPLK"] || row["Nr PLK"] || row["NrPLK "] || "";
        }
    }
    return "";
}

function setLiniePatrolMode(index, mode) {
    if (mode) liniePatrolModes[index] = mode;
    else delete liniePatrolModes[index];
    renderLinie();
}

function setLiniePersonRole(patrolIndex, personName, role) {
    const key = personRoleKey(patrolIndex, personName);
    // toggle – drugie kliknięcie tej samej roli odznacza
    if (liniePersonRoles[key] === role) delete liniePersonRoles[key];
    else liniePersonRoles[key] = role;
    renderLinie();
}

// ==============================================
// BUDOWANIE TABEL
// ==============================================

function buildAllPersonTables(today) {
    const patrole = appState.patrole || [];
    let html = "";
    let any = false;

    patrole.forEach((patrol, index) => {
        const mode = liniePatrolModes[index];
        if (!mode) return;

        const people = getPatrolPeopleList(patrol);
        if (people.length === 0) return;

        people.forEach(personName => {
            const person = {
                fullName: personName,
                nrPLK: getNrPLK(personName)
            };

            if (mode === "teren") {
                html += createPersonTableTeren(person, today);
                any = true;
            } else if (mode === "stacjonarny") {
                const key = personRoleKey(index, personName);
                const role = liniePersonRoles[key];
                if (!role) return; // jeszcze nie wybrano roli
                html += createPersonTableStacjonarny(person, today, role);
                any = true;
            }
        });
    });

    return any ? html : "";
}

function createPersonTableTeren(person, today) {
    return `
    <div style="margin-bottom:30px;">
        <div style="background:#FFFF00; color:black; padding:14px 18px; font-size:18px; font-weight:bold; border-radius:6px 6px 0 0;">
            ${escapeHtml(person.fullName)} <span style="font-size:13px; font-weight:600; color:#334155;">(teren)</span>
        </div>
        <table class="excelSubTable" style="width:100%; border-collapse:collapse; border:2px solid #475569;">
            <tbody>
                <tr style="background:#1e40af; color:white;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center; width:15%;">${escapeHtml(person.nrPLK)}</td>
                    <td style="padding:12px; border:1px solid #475569;">${escapeHtml(appState.linie?.szlak || "")}</td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center; width:15%;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
                <tr style="background:#166534; color:white;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center;">${escapeHtml(person.nrPLK)}</td>
                    <td style="padding:12px; border:1px solid #475569;">${escapeHtml(appState.linie?.osobowa || "")}</td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
                <tr style="background:#854d0e; color:white;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center;">${escapeHtml(person.nrPLK)}</td>
                    <td style="padding:12px; border:1px solid #475569;">${escapeHtml(appState.linie?.towarowa || "")}</td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
            </tbody>
        </table>
    </div>`;
}

function createPersonTableStacjonarny(person, today, role) {
    const isDyzurny = role === "dyzurny";
    const lineNum = isDyzurny ? (appState.linie?.dyzurny || "") : (appState.linie?.komendant || "");
    const roleLabel = isDyzurny ? "Dyżurny zmiany" : "Komendant";
    const bg = isDyzurny ? "#7c3aed" : "#be185d";

    return `
    <div style="margin-bottom:30px;">
        <div style="background:#FFFF00; color:black; padding:14px 18px; font-size:18px; font-weight:bold; border-radius:6px 6px 0 0;">
            ${escapeHtml(person.fullName)} <span style="font-size:13px; font-weight:600; color:#334155;">(stacjonarny – ${roleLabel})</span>
        </div>
        <table class="excelSubTable" style="width:100%; border-collapse:collapse; border:2px solid #475569;">
            <tbody>
                <tr style="background:${bg}; color:white;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center; width:15%;">${escapeHtml(person.nrPLK)}</td>
                    <td style="padding:12px; border:1px solid #475569;">${escapeHtml(lineNum)}</td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:0 solid #475569;"></td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center; width:15%;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
            </tbody>
        </table>
    </div>`;
}

// =====================================
// ZAPIS NUMERÓW LINII
// =====================================

function saveLine(type, value) {
    if (!appState.linie) appState.linie = {};
    appState.linie[type] = value.trim();
    saveState();
    renderLinie();
}

// =====================================
// KOPIOWANIE
// =====================================

function copyAllTables() {
    const tables = document.querySelectorAll(".excelSubTable");
    if (tables.length === 0) {
        alert("Brak tabel do skopiowania. Wybierz tryb patrolu i (dla stacjonarnego) role osób.");
        return;
    }

    let combinedText = "";

    tables.forEach((table, index) => {
        const rows = table.querySelectorAll("tr");
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            const rowData = Array.from(cells).map(cell => cell.innerText.trim());
            combinedText += rowData.join("\t") + "\n";
        });
        if (index < tables.length - 1) {
            combinedText += "\n";
        }
    });

    navigator.clipboard.writeText(combinedText.trim()).then(() => {
        alert(`✅ Skopiowano ${tables.length} tabel do Excela!\n\nWklej (Ctrl + V)`);
    }).catch(() => {
        alert("Nie udało się skopiować automatycznie. Zaznacz tabele ręcznie i Ctrl+C.");
    });
}

// =====================================
// EXPOSE
// =====================================
window.saveLine = saveLine;
window.copyAllTables = copyAllTables;
window.setLiniePatrolMode = setLiniePatrolMode;
window.setLiniePersonRole = setLiniePersonRole;
window.initLinie = initLinie;
