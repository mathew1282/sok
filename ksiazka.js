// =====================================
// KSIĄŻKA WYDARZEŃ
// =====================================

function ensureKsiazkaState() {
    if (!Array.isArray(appState.ksiazkaWydarzen)) {
        appState.ksiazkaWydarzen = [];
    }
}

function nowHHMM() {
    return new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function todayPL() {
    return new Date().toLocaleDateString("pl-PL");
}

function tomorrowPL() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("pl-PL");
}

/** Parsuje "HH:MM" → {h, m} lub null */
function parseTimeParts(str) {
    const m = String(str || "").trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return { h, m: min };
}

/** Buduje Date z daty PL (dd.mm.rrrr) + HH:MM */
function entryToDate(entry) {
    const parts = parseTimeParts(entry.godzinaStart);
    if (!parts) return null;

    let day = new Date();
    if (entry.data) {
        const dm = String(entry.data).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (dm) {
            day = new Date(parseInt(dm[3], 10), parseInt(dm[2], 10) - 1, parseInt(dm[1], 10));
        }
    }
    day.setHours(parts.h, parts.m, 0, 0);
    return day;
}

function isOverdue(entry) {
    if (entry.zrobione) return false;
    const dt = entryToDate(entry);
    if (!dt) return false;
    return new Date() > dt;
}

function getPatrolName(index) {
    const p = appState.patrole?.[index];
    return (p && p.nazwa) ? p.nazwa : ("Patrol " + (index + 1));
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Sortuje wpisy od najstarszych do najmłodszych */
function sortEntriesOldestFirst(entries) {
    return [...entries].sort((a, b) => {
        const da = entryToDate(a) || new Date(0);
        const db = entryToDate(b) || new Date(0);
        return da - db;
    });
}

// =====================================
// MODAL PO GENERUJ WPIS (tylko godzina rozpoczęcia)
// =====================================

function openKsiazkaSaveModal(tekst, patrolIndexes) {
    ensureKsiazkaState();

    const old = document.getElementById("ksiazkaSaveModal");
    if (old) old.remove();

    const now = nowHHMM();
    const patrolNames = (patrolIndexes || []).map(i => getPatrolName(i)).join(", ") || "Brak patrolu";

    const overlay = document.createElement("div");
    overlay.id = "ksiazkaSaveModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";

    overlay.innerHTML = `
        <div class="modal" style="max-width:480px;">
            <h2 style="margin-top:0;">Zapisz do Książki wydarzeń</h2>
            <p style="color:#94a3b8; font-size:14px; margin-bottom:16px;">
                Patrol: <strong>${escapeHtml(patrolNames)}</strong>
            </p>

            <div style="margin-bottom:14px;">
                <label>Godzina rozpoczęcia</label>
                <input type="time" id="ksiazkaGodzStart" value="${now}" style="width:100%;">
                <div style="font-size:12px; color:#94a3b8; margin-top:6px;">
                    Po 18:00 godziny 0:00–11:59 → następny dzień (noc).
                    Wcześniejsze godziny wieczorem (np. 22 przy 23) → dziś.
                </div>
            </div>

            <div style="margin-bottom:16px;">
                <label>Podgląd wpisu</label>
                <div style="background:#0f172a; border:1px solid #334155; border-radius:10px; padding:12px; max-height:160px; overflow:auto; font-size:13px; white-space:pre-wrap; color:#e2e8f0;">
${escapeHtml(tekst)}
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn-success" onclick="confirmSaveToKsiazka()">Zapisz</button>
                <button class="btn-danger" onclick="closeKsiazkaSaveModal()">Anuluj</button>
            </div>
        </div>
    `;

    overlay._tekst = tekst;
    overlay._patrolIndexes = patrolIndexes || [];

    document.body.appendChild(overlay);
}

function closeKsiazkaSaveModal() {
    const m = document.getElementById("ksiazkaSaveModal");
    if (m) m.remove();
}

async function confirmSaveToKsiazka() {
    const modal = document.getElementById("ksiazkaSaveModal");
    if (!modal) return;

    const tekst = modal._tekst || "";
    const patrolIndexes = modal._patrolIndexes || [];
    const godzStart = document.getElementById("ksiazkaGodzStart")?.value || nowHHMM();

    // Po 18:00: tylko godziny 0:00–11:59 (noc/poranek) → następny dzień.
    // Wcześniejsza godzina wieczorem (np. 22:00 przy 23:00) → dziś.
    // Przed 18:00: zawsze dziś (uzupełnianie wstecz).
    const parts = parseTimeParts(godzStart);
    let dataWpisu = todayPL();
    if (parts) {
        const now = new Date();
        const chosen = new Date();
        chosen.setHours(parts.h, parts.m, 0, 0);
        if (chosen < now && now.getHours() >= 18 && parts.h < 12) {
            dataWpisu = tomorrowPL();
        }
    }

    ensureKsiazkaState();

    appState.ksiazkaWydarzen.push({
        id: Date.now() + Math.random().toString(36).slice(2),
        data: dataWpisu,
        godzinaStart: godzStart,
        tekst: tekst,
        patrole: [...patrolIndexes],
        zrobione: false,
        createdAt: new Date().toISOString()
    });

    await saveState();
    closeKsiazkaSaveModal();

    if (typeof showToast === "function") {
        showToast("✅ Zapisano do Książki wydarzeń");
    } else {
        alert("Zapisano do Książki wydarzeń");
    }

    if (document.getElementById("ksiazkaContainer")) {
        renderKsiazka();
    }
}

// =====================================
// PODPIĘCIE DO GENERATORA
// =====================================

function getGeneratedEntryPlainForKsiazka() {
    const el = document.getElementById("generatedEntry");
    if (!el) return "";
    return (el.innerText || el.textContent || "").trim();
}

(function patchGenerateEntry() {
    const original = window.generateEntry;

    window.generateEntry = function () {
        if (typeof original === "function") {
            original.apply(this, arguments);
        }

        setTimeout(() => {
            const tekst = getGeneratedEntryPlainForKsiazka();
            if (!tekst) return;

            const patrols = (typeof selectedPatrols !== "undefined" && Array.isArray(selectedPatrols))
                ? [...selectedPatrols]
                : [];

            openKsiazkaSaveModal(tekst, patrols);
        }, 150);
    };
})();

// =====================================
// RENDER KSIĄŻKI
// =====================================

let ksiazkaFilterPatrole = [];
let ksiazkaFilterInne = false; // filtr "Inne" = wpisy bez patroli

function initKsiazka() {
    ensureKsiazkaState();
    ksiazkaFilterPatrole = [];
    ksiazkaFilterInne = false;
    renderKsiazka();

    if (window._ksiazkaInterval) clearInterval(window._ksiazkaInterval);
    window._ksiazkaInterval = setInterval(() => {
        if (document.getElementById("ksiazkaContainer")) {
            renderKsiazka();
        }
    }, 20000);
}

function toggleKsiazkaFilter(patrolIndex) {
    ksiazkaFilterInne = false;
    const pos = ksiazkaFilterPatrole.indexOf(patrolIndex);
    if (pos > -1) ksiazkaFilterPatrole.splice(pos, 1);
    else ksiazkaFilterPatrole.push(patrolIndex);
    renderKsiazka();
}

function toggleKsiazkaFilterInne() {
    ksiazkaFilterPatrole = [];
    ksiazkaFilterInne = !ksiazkaFilterInne;
    renderKsiazka();
}

function clearKsiazkaFilter() {
    ksiazkaFilterPatrole = [];
    ksiazkaFilterInne = false;
    renderKsiazka();
}

function renderKsiazka() {
    const container = document.getElementById("ksiazkaContainer");
    if (!container) return;
    ensureKsiazkaState();

    const allEntries = sortEntriesOldestFirst(appState.ksiazkaWydarzen);
    const patrole = appState.patrole || [];

    let filtered = allEntries;
    if (ksiazkaFilterInne) {
        filtered = allEntries.filter(e => !e.patrole || e.patrole.length === 0);
    } else if (ksiazkaFilterPatrole.length > 0) {
        filtered = allEntries.filter(e =>
            (e.patrole || []).some(p => ksiazkaFilterPatrole.includes(p))
        );
    }

    const noPatrolFilter = !ksiazkaFilterInne && ksiazkaFilterPatrole.length === 0;

    let html = `
    <div class="card ksiazka-card">
        <div class="ksiazka-sticky-bar">
            <div class="ksiazka-sticky-left">
                <h2 style="margin:0; white-space:nowrap;">📖 Książka wydarzeń</h2>
                <div class="ksiazka-filters">
                    <div class="line-pill ${noPatrolFilter ? "active" : ""}" onclick="clearKsiazkaFilter()" style="cursor:pointer;">
                        Wszystkie
                    </div>
                    ${patrole.map((p, idx) => `
                        <div class="line-pill ${ksiazkaFilterPatrole.includes(idx) ? "active" : ""}"
                             onclick="toggleKsiazkaFilter(${idx})" style="cursor:pointer;">
                            ${escapeHtml(p.nazwa || ("Patrol " + (idx + 1)))}
                        </div>
                    `).join("")}
                    <div class="line-pill ${ksiazkaFilterInne ? "active" : ""}" onclick="toggleKsiazkaFilterInne()" style="cursor:pointer;">
                        Inne
                    </div>
                </div>
            </div>
            <div class="ksiazka-sticky-right">
                <button class="btn-primary" onclick="openPlanSluzbyModal()">📅 Służba dzienna</button>
                <button class="btn-primary" onclick="openKsiazkaUwagiPicker()">Uwagi</button>
                <button class="btn-success" onclick="openKsiazkaSprawdzenieModal()">Sprawdzenie</button>
                <button class="btn-primary" onclick="exportKsiazkaFiltered()">📋 Eksport (kopiuj)</button>
                <button class="btn-danger" onclick="clearAllKsiazka()">Kasuj wszystkie</button>
            </div>
        </div>
    `;

    // Lista gdy brak filtrów / 1 patrol / Inne; kolumny tylko przy 2+ patrolach
    if (ksiazkaFilterInne || ksiazkaFilterPatrole.length <= 1) {
        html += renderKsiazkaListView(filtered);
    } else {
        html += renderKsiazkaColumnsView(filtered);
    }

    html += `</div>`;
    container.innerHTML = html;
}

/** Widok listy: 3 kolumny (Godzina | Informacje | Akcje) */
function renderKsiazkaListView(entries) {
    if (entries.length === 0) {
        return `<div style="color:#64748b; padding:20px 0;">Brak wpisów</div>`;
    }

    let html = `
    <div class="ksiazka-list">
        <div class="ksiazka-row ksiazka-header">
            <div class="ksiazka-col-time">Godzina</div>
            <div class="ksiazka-col-info">Informacje</div>
            <div class="ksiazka-col-actions">Akcje</div>
        </div>
    `;

    entries.forEach(entry => {
        const globalIdx = appState.ksiazkaWydarzen.findIndex(e => e.id === entry.id);
        const overdue = isOverdue(entry);
        const done = !!entry.zrobione;

        let rowClass = "ksiazka-row";
        if (done) rowClass += " ksiazka-done";
        else if (overdue) rowClass += " ksiazka-overdue";

        const patrolLabel = (entry.patrole || []).map(i => getPatrolName(i)).join(", ");

        html += `
        <div class="${rowClass}">
            <div class="ksiazka-col-time">
                <div class="ksiazka-time">${escapeHtml(entry.godzinaStart || "—")}</div>
                <div class="ksiazka-date">${escapeHtml(entry.data || "")}</div>
                ${patrolLabel ? `<div class="ksiazka-patrol">${escapeHtml(patrolLabel)}</div>` : ""}
            </div>
            <div class="ksiazka-col-info">
                <div class="ksiazka-text">${escapeHtml(entry.tekst)}</div>
            </div>
            <div class="ksiazka-col-actions">
                ${!done ? `
                    <button class="btn-success" style="padding:5px 10px; font-size:12px;" onclick="oznaczZrobione(${globalIdx})">Zrobione</button>
                ` : `
                    <button class="btn-primary" style="padding:5px 10px; font-size:12px;" onclick="odznaczZrobione(${globalIdx})">Cofnij</button>
                `}
                <button class="btn-primary" style="padding:5px 10px; font-size:12px;" onclick="kopiujWpisKsiazki(${globalIdx})">Kopiuj</button>
                <button class="btn-primary" style="padding:5px 10px; font-size:12px;" onclick="edytujWpisKsiazki(${globalIdx})">Edytuj</button>
                <button class="btn-danger" style="padding:5px 10px; font-size:12px;" onclick="usunWpisKsiazki(${globalIdx})">Kasuj</button>
            </div>
        </div>
        `;
    });

    html += `</div>`;
    return html;
}

/** Widok kolumn (gdy wybrano 2+ patrole) */
function renderKsiazkaColumnsView(filtered) {
    const columns = ksiazkaFilterPatrole.map(idx => ({
        key: idx,
        name: getPatrolName(idx),
        entries: filtered.filter(e => (e.patrole || []).includes(idx))
    }));

    let html = `<div style="display:flex; gap:16px; overflow-x:auto; align-items:flex-start;">`;

    columns.forEach(col => {
        html += `
        <div style="min-width:280px; max-width:380px; flex:1; background:#1e293b; border:1px solid #334155; border-radius:12px; padding:14px;">
            <div style="font-weight:700; font-size:16px; margin-bottom:12px; color:#60a5fa; border-bottom:1px solid #334155; padding-bottom:8px;">
                ${escapeHtml(col.name)} <span style="color:#94a3b8; font-weight:500; font-size:13px;">(${col.entries.length})</span>
            </div>
        `;

        if (col.entries.length === 0) {
            html += `<div style="color:#64748b; font-size:13px; padding:10px 0;">Brak wpisów</div>`;
        } else {
            col.entries.forEach(entry => {
                const globalIdx = appState.ksiazkaWydarzen.findIndex(e => e.id === entry.id);
                const overdue = isOverdue(entry);
                const done = !!entry.zrobione;

                let boxStyle = "background:#0f172a; border:1px solid #334155;";
                let extraClass = "";
                if (done) {
                    boxStyle = "background:rgba(34,197,94,0.15); border:1px solid #22c55e;";
                } else if (overdue) {
                    boxStyle = "background:rgba(220,38,38,0.18); border:1px solid #dc2626;";
                    extraClass = "ksiazka-overdue-box";
                }

                html += `
                <div class="${extraClass}" style="${boxStyle} border-radius:10px; padding:12px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:13px;">
                        <span style="color:#94a3b8;">${escapeHtml(entry.data)} · <strong style="color:#e2e8f0;">${escapeHtml(entry.godzinaStart || "—")}</strong></span>
                        ${done ? "<span style='color:#4ade80;'>✅</span>" : (overdue ? "<span style='color:#f87171;'>⚠</span>" : "")}
                    </div>
                    <div style="font-size:13.5px; line-height:1.45; white-space:pre-wrap; color:#e2e8f0; margin-bottom:10px;">
                        ${escapeHtml(entry.tekst)}
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${!done ? `
                            <button class="btn-success" style="padding:5px 10px; font-size:12px;" onclick="oznaczZrobione(${globalIdx})">Zrobione</button>
                        ` : `
                            <button class="btn-primary" style="padding:5px 10px; font-size:12px;" onclick="odznaczZrobione(${globalIdx})">Cofnij</button>
                        `}
                        <button class="btn-primary" style="padding:5px 10px; font-size:12px;" onclick="kopiujWpisKsiazki(${globalIdx})">Kopiuj</button>
                        <button class="btn-primary" style="padding:5px 10px; font-size:12px;" onclick="edytujWpisKsiazki(${globalIdx})">Edytuj</button>
                        <button class="btn-danger" style="padding:5px 10px; font-size:12px;" onclick="usunWpisKsiazki(${globalIdx})">Kasuj</button>
                    </div>
                </div>
                `;
            });
        }
        html += `</div>`;
    });

    html += `</div>`;
    return html;
}

// =====================================
// AKCJE
// =====================================

async function oznaczZrobione(index) {
    ensureKsiazkaState();
    if (!appState.ksiazkaWydarzen[index]) return;
    appState.ksiazkaWydarzen[index].zrobione = true;
    await saveState();
    renderKsiazka();
}

async function odznaczZrobione(index) {
    ensureKsiazkaState();
    if (!appState.ksiazkaWydarzen[index]) return;
    appState.ksiazkaWydarzen[index].zrobione = false;
    await saveState();
    renderKsiazka();
}

async function usunWpisKsiazki(index) {
    ensureKsiazkaState();
    if (!appState.ksiazkaWydarzen[index]) return;
    if (!confirm("Na pewno usunąć ten wpis?")) return;
    appState.ksiazkaWydarzen.splice(index, 1);
    await saveState();
    renderKsiazka();
}

async function clearAllKsiazka() {
    ensureKsiazkaState();
    if (appState.ksiazkaWydarzen.length === 0) {
        alert("Brak wpisów do usunięcia");
        return;
    }
    if (!confirm("Na pewno usunąć WSZYSTKIE wpisy z Książki wydarzeń?")) return;
    appState.ksiazkaWydarzen = [];
    await saveState();
    renderKsiazka();
}

async function kopiujWpisKsiazki(index) {
    ensureKsiazkaState();
    const e = appState.ksiazkaWydarzen[index];
    if (!e) return;
    // Usuń kropki / bullet-y jak w generatorze – tylko do schowka
    let text = String(e.tekst || "");
    text = text.split("\n").map(line => line.replace(/^[\s•·.\-–—]+/, "").trimStart()).join("\n").trim();
    try {
        await navigator.clipboard.writeText(text);
        if (typeof showToast === "function") showToast("✅ Skopiowano");
        else alert("Skopiowano");
    } catch (err) {
        alert("Nie udało się skopiować");
    }
}

// =====================================
// EDYCJA WPISU (kafelki + ręcznie)
// =====================================

function edytujWpisKsiazki(index) {
    ensureKsiazkaState();
    const entry = appState.ksiazkaWydarzen[index];
    if (!entry) return;

    const old = document.getElementById("ksiazkaEditModal");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "ksiazkaEditModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay._editIndex = index;

    const poleceniaPills = (appState.polecenia?.rows || []).map((r, i) => {
        const label = (r.OpisKrotki || r.Opis || ("Polecenie " + (i + 1))).slice(0, 40);
        return `<div class="line-pill" style="cursor:pointer; font-size:13px;" onclick="insertTileToEdit('pol', ${i})">${escapeHtml(label)}</div>`;
    }).join("") || "<span style='color:#64748b; font-size:13px;'>Brak poleceń</span>";

    const zgloszeniaPills = (appState.zgloszenia?.rows || []).map((r, i) => {
        const label = (r.OpisKrotki || r.Opis || ("Zgłoszenie " + (i + 1))).slice(0, 40);
        return `<div class="line-pill" style="cursor:pointer; font-size:13px;" onclick="insertTileToEdit('zgl', ${i})">${escapeHtml(label)}</div>`;
    }).join("") || "<span style='color:#64748b; font-size:13px;'>Brak zgłoszeń</span>";

    const szablonyPills = (appState.szablony || []).map((s, i) => {
        const label = (s.nazwa || s.tekst || ("Szablon " + (i + 1))).slice(0, 40);
        return `<div class="line-pill" style="cursor:pointer; font-size:13px;" onclick="insertTileToEdit('szab', ${i})">${escapeHtml(label)}</div>`;
    }).join("");

    overlay.innerHTML = `
        <div class="modal" style="max-width:720px;">
            <h2 style="margin-top:0;">Edytuj wpis</h2>

            <div style="margin-bottom:14px;">
                <label>Godzina rozpoczęcia</label>
                <input type="time" id="editGodzStart" value="${escapeHtml(entry.godzinaStart || "")}" style="width:160px;">
            </div>

            <div style="margin-bottom:12px;">
                <label>Treść wpisu (możesz edytować ręcznie)</label>
                <textarea id="editTekst" rows="8" style="width:100%; font-size:14px; line-height:1.5;">${escapeHtml(entry.tekst || "")}</textarea>
            </div>

            <div style="margin-bottom:10px;">
                <div style="font-size:13px; color:#94a3b8; margin-bottom:6px;">Wstaw z Poleceń (klik = dopisz na końcu):</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:90px; overflow:auto;">
                    ${poleceniaPills}
                </div>
            </div>

            <div style="margin-bottom:10px;">
                <div style="font-size:13px; color:#94a3b8; margin-bottom:6px;">Wstaw ze Zgłoszeń (klik = dopisz na końcu):</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:90px; overflow:auto;">
                    ${zgloszeniaPills}
                </div>
            </div>

            ${szablonyPills ? `
            <div style="margin-bottom:14px;">
                <div style="font-size:13px; color:#94a3b8; margin-bottom:6px;">Szablony:</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:70px; overflow:auto;">
                    ${szablonyPills}
                </div>
            </div>
            ` : ""}

            <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
                <button class="btn-primary" style="font-size:13px;" onclick="replaceAllFromTile()">Zastąp całość ostatnim kaflem</button>
                <button class="btn-danger" style="font-size:13px;" onclick="document.getElementById('editTekst').value=''">Wyczyść treść</button>
            </div>

            <div class="modal-actions">
                <button class="btn-success" onclick="confirmEditKsiazka()">Zapisz zmiany</button>
                <button class="btn-danger" onclick="closeKsiazkaEditModal()">Anuluj</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    window._lastTileText = null;
}

function insertTileToEdit(typ, index) {
    let text = "";
    if (typ === "pol") {
        const row = appState.polecenia?.rows?.[index];
        text = row?.Opis || row?.OpisKrotki || "";
    } else if (typ === "zgl") {
        const row = appState.zgloszenia?.rows?.[index];
        text = row?.Opis || row?.OpisKrotki || "";
    } else if (typ === "szab") {
        const s = appState.szablony?.[index];
        text = s?.tekst || s?.nazwa || "";
    }
    if (!text) return;

    window._lastTileText = text;
    const ta = document.getElementById("editTekst");
    if (!ta) return;

    const cur = ta.value || "";
    if (cur.trim()) {
        ta.value = cur.trimEnd() + "\n\n" + text;
    } else {
        ta.value = text;
    }
    ta.focus();
}

function replaceAllFromTile() {
    if (!window._lastTileText) {
        alert("Najpierw kliknij jakiś kafelek");
        return;
    }
    const ta = document.getElementById("editTekst");
    if (ta) ta.value = window._lastTileText;
}

function closeKsiazkaEditModal() {
    const m = document.getElementById("ksiazkaEditModal");
    if (m) m.remove();
}

async function confirmEditKsiazka() {
    const modal = document.getElementById("ksiazkaEditModal");
    if (!modal) return;
    const index = modal._editIndex;
    ensureKsiazkaState();
    if (!appState.ksiazkaWydarzen[index]) return;

    const newTekst = document.getElementById("editTekst")?.value || "";
    const newGodz = document.getElementById("editGodzStart")?.value || appState.ksiazkaWydarzen[index].godzinaStart;

    appState.ksiazkaWydarzen[index].tekst = newTekst;
    appState.ksiazkaWydarzen[index].godzinaStart = newGodz;

    await saveState();
    closeKsiazkaEditModal();
    renderKsiazka();

    if (typeof showToast === "function") showToast("✅ Zapisano zmiany");
}

// =====================================
// PLANOWANIE SŁUŻBY DZIENNEJ
// =====================================

function openPlanSluzbyModal() {
    const old = document.getElementById("planSluzbyModal");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "planSluzbyModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";

    const patrolOptions = (appState.patrole || []).map((p, i) =>
        `<label style="display:flex;align-items:center;gap:6px;margin-right:12px;cursor:pointer;">
            <input type="checkbox" class="plan-patrol-cb" value="${i}" checked>
            ${escapeHtml(p.nazwa || ("Patrol " + (i + 1)))}
        </label>`
    ).join("") || "<span style='color:#94a3b8;'>Brak patroli – dodaj je w zakładce Patrole</span>";

    const zglOptions = (appState.zgloszenia?.rows || []).map((r, i) => {
        const label = (r.OpisKrotki || r.Opis || ("Zgłoszenie " + (i + 1))).slice(0, 60);
        return `<option value="zgl_${i}">${escapeHtml(label)}</option>`;
    }).join("");

    const polOptions = (appState.polecenia?.rows || []).map((r, i) => {
        const label = (r.OpisKrotki || r.Opis || ("Polecenie " + (i + 1))).slice(0, 60);
        return `<option value="pol_${i}">${escapeHtml(label)}</option>`;
    }).join("");

    overlay.innerHTML = `
        <div class="modal" style="max-width:520px;">
            <h2 style="margin-top:0;">📅 Służba dzienna – szablon</h2>
            <p style="color:#94a3b8; font-size:14px; margin-bottom:16px;">
                Ustaw godziny. Program utworzy punkty dnia w Książce wydarzeń.
            </p>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                <div>
                    <label>Przyjęcie służby</label>
                    <input type="time" id="planPrzyjecie" value="06:00" style="width:100%;">
                </div>
                <div>
                    <label>Odprawa</label>
                    <input type="time" id="planOdprawa" value="07:00" style="width:100%;">
                </div>
                <div>
                    <label>Rozdysponowanie patroli</label>
                    <input type="time" id="planRozdysponowanie" value="07:30" style="width:100%;">
                </div>
                <div>
                    <label>Pierwsze zgłoszenie</label>
                    <input type="time" id="planPierwszeZgl" value="08:00" style="width:100%;">
                </div>
                <div>
                    <label>Interwał zgłoszeń (min)</label>
                    <input type="number" id="planInterwal" value="60" min="15" max="180" step="15" style="width:100%;">
                </div>
                <div>
                    <label>Zdanie służby</label>
                    <input type="time" id="planZdanie" value="18:00" style="width:100%;">
                </div>
            </div>

            <div style="margin-bottom:16px;">
                <label style="margin-bottom:8px;display:block;">Patrole do planu:</label>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    ${patrolOptions}
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <label>Treść cyklicznych zgłoszeń (opcjonalnie)</label>
                <textarea id="planTrescZgl" rows="2" placeholder="Np. Zgłoszenie lokalizacji i sytuacji – bez wydarzeń" style="width:100%;"></textarea>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                <div>
                    <label>Szablon ze Zgłoszeń</label>
                    <select id="planSelectZgl" style="width:100%;">
                        <option value="">— brak —</option>
                        ${zglOptions}
                    </select>
                </div>
                <div>
                    <label>Szablon z Poleceń</label>
                    <select id="planSelectPol" style="width:100%;">
                        <option value="">— brak —</option>
                        ${polOptions}
                    </select>
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn-success" onclick="confirmPlanSluzby()">Utwórz plan dnia</button>
                <button class="btn-danger" onclick="closePlanSluzbyModal()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function closePlanSluzbyModal() {
    const m = document.getElementById("planSluzbyModal");
    if (m) m.remove();
}

function timeToMinutes(hhmm) {
    const p = parseTimeParts(hhmm);
    if (!p) return 0;
    return p.h * 60 + p.m;
}

function minutesToHHMM(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

async function confirmPlanSluzby() {
    ensureKsiazkaState();

    const przyjecie = document.getElementById("planPrzyjecie")?.value || "06:00";
    const odprawa = document.getElementById("planOdprawa")?.value || "07:00";
    const rozdysp = document.getElementById("planRozdysponowanie")?.value || "07:30";
    const pierwsze = document.getElementById("planPierwszeZgl")?.value || "08:00";
    const interwal = parseInt(document.getElementById("planInterwal")?.value || "60", 10) || 60;
    const zdanie = document.getElementById("planZdanie")?.value || "18:00";

    const patrolIndexes = [];
    document.querySelectorAll(".plan-patrol-cb:checked").forEach(cb => {
        patrolIndexes.push(parseInt(cb.value, 10));
    });

    let trescCykliczna = (document.getElementById("planTrescZgl")?.value || "").trim();
    const selZgl = document.getElementById("planSelectZgl")?.value || "";
    const selPol = document.getElementById("planSelectPol")?.value || "";
    if (!trescCykliczna && selZgl.startsWith("zgl_")) {
        const i = parseInt(selZgl.slice(4), 10);
        const row = appState.zgloszenia?.rows?.[i];
        if (row) trescCykliczna = row.Opis || row.OpisKrotki || "";
    }
    if (!trescCykliczna && selPol.startsWith("pol_")) {
        const i = parseInt(selPol.slice(4), 10);
        const row = appState.polecenia?.rows?.[i];
        if (row) trescCykliczna = row.Opis || row.OpisKrotki || "";
    }

    const punkty = [];

    punkty.push({ godzinaStart: przyjecie, tekst: "Przyjęcie służby", patrole: [] });
    punkty.push({ godzinaStart: odprawa, tekst: "Odprawa", patrole: [] });
    punkty.push({ godzinaStart: rozdysp, tekst: "Rozdysponowanie patroli", patrole: [...patrolIndexes] });

    let cur = timeToMinutes(pierwsze);
    const koniec = timeToMinutes(zdanie);

    while (cur < koniec) {
        const startHH = minutesToHHMM(cur);
        if (patrolIndexes.length === 0) {
            punkty.push({
                godzinaStart: startHH,
                tekst: trescCykliczna || "Zgłoszenie sytuacji / lokalizacji patroli",
                patrole: []
            });
        } else {
            patrolIndexes.forEach(idx => {
                const base = trescCykliczna || ("Zgłoszenie – " + getPatrolName(idx));
                punkty.push({
                    godzinaStart: startHH,
                    tekst: base,
                    patrole: [idx]
                });
            });
        }
        cur += interwal;
    }

    punkty.push({ godzinaStart: zdanie, tekst: "Zdanie służby", patrole: [] });

    const data = todayPL();
    punkty.forEach(p => {
        appState.ksiazkaWydarzen.push({
            id: Date.now() + Math.random().toString(36).slice(2),
            data: data,
            godzinaStart: p.godzinaStart,
            tekst: p.tekst,
            patrole: p.patrole,
            zrobione: false,
            createdAt: new Date().toISOString(),
            zPlanu: true
        });
    });

    await saveState();
    closePlanSluzbyModal();

    if (typeof showToast === "function") {
        showToast("✅ Utworzono plan dnia (" + punkty.length + " punktów)");
    } else {
        alert("Utworzono plan dnia: " + punkty.length + " punktów");
    }

    if (document.getElementById("ksiazkaContainer")) {
        renderKsiazka();
    }
}





// =====================================
// EKSPORT FILTROWANEJ LISTY (godzina + opis → schowek)
// =====================================

function getKsiazkaFilteredEntries() {
    ensureKsiazkaState();
    const allEntries = (typeof sortEntriesOldestFirst === "function")
        ? sortEntriesOldestFirst(appState.ksiazkaWydarzen)
        : [...(appState.ksiazkaWydarzen || [])];

    if (ksiazkaFilterInne) {
        return allEntries.filter(e => !e.patrole || e.patrole.length === 0);
    }
    if (ksiazkaFilterPatrole.length > 0) {
        return allEntries.filter(e =>
            (e.patrole || []).some(p => ksiazkaFilterPatrole.includes(p))
        );
    }
    return allEntries;
}

async function exportKsiazkaFiltered() {
    const entries = getKsiazkaFilteredEntries();
    if (!entries.length) {
        if (typeof showToast === "function") showToast("Brak wpisów do eksportu");
        else alert("Brak wpisów do eksportu");
        return;
    }

    // Format: _data_ *godzina* \n opis (bez czarnych kropek/punktorów)
    // _…_ = kursywa, *…* = pogrubienie w WhatsApp
    const blocks = entries.map(e => {
        const data = String(e.data || "").trim() || "—";
        const godz = String(e.godzinaStart || "—").trim();
        let tekst = String(e.tekst || "")
            .replace(/\r\n/g, "\n")
            // usuń typowe czarne kropki / punktory
            .replace(/[•·●▪▫○◦‣⁃∙]/g, "")
            .replace(/^\s*[-*–—]\s+/gm, "")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        return "_" + data + "_ *" + godz + "*\n" + tekst;
    });

    const text = blocks.join("\n\n");

    try {
        await navigator.clipboard.writeText(text);
        if (typeof showToast === "function") {
            showToast("✅ Skopiowano " + entries.length + " wpisów");
        } else {
            alert("Skopiowano " + entries.length + " wpisów");
        }
    } catch (err) {
        prompt("Skopiuj ręcznie (Ctrl+C):", text);
    }
}

// =====================================
// SPRAWDZENIE
// 1) lista wpisów z książki – kliknięcie odznacza/zaznacza (domyślnie wszystkie zaznaczone)
// 2) Dalej → okno zbiorcze z godzinami
//    (linia / nazwa / km pobrane z pasującego polecenia Szlak|towarowa|osobowa)
// =====================================

const SPRAWDZENIE_RODZAJE = ["Szlak", "Stacja towarowa", "Stacja osobowa"];

function getPoleceniaSprawdzenie() {
    const rows = appState.polecenia?.rows || [];
    return rows
        .map((r, i) => ({ ...r, _index: i }))
        .filter(r => r && SPRAWDZENIE_RODZAJE.includes(r.Rodzaj));
}

function entryMatchesPolecenieSprawdzenie(entry, pol) {
    const t = String(entry.tekst || "").toLowerCase();
    if (!t) return false;
    const keys = [pol.Nazwa, pol.OpisKrotki, pol.Opis, pol.NazwaSzlaku]
        .map(x => String(x || "").trim())
        .filter(x => x.length >= 3);
    return keys.some(k => t.includes(k.toLowerCase()));
}

function getKsiazkaWpisyDoSprawdzenia() {
    ensureKsiazkaState();
    const pols = getPoleceniaSprawdzenie();
    if (!pols.length) return [];
    const entries = (typeof sortEntriesOldestFirst === "function")
        ? sortEntriesOldestFirst(appState.ksiazkaWydarzen)
        : [...(appState.ksiazkaWydarzen || [])];
    return entries.filter(e => pols.some(p => entryMatchesPolecenieSprawdzenie(e, p)));
}

/** Dla wpisu zwraca pierwsze pasujące polecenie (Szlak / towarowa / osobowa) */
function findMatchingPolecenieForEntry(entry) {
    const pols = getPoleceniaSprawdzenie();
    return pols.find(p => entryMatchesPolecenieSprawdzenie(entry, p)) || null;
}

function openKsiazkaSprawdzenieModal() {
    const items = getKsiazkaWpisyDoSprawdzenia();
    if (items.length === 0) {
        if (typeof showToast === "function") {
            showToast("Brak wpisów powiązanych z Szlak / Stacja towarowa / Stacja osobowa");
        } else {
            alert("Brak wpisów powiązanych z Szlak / Stacja towarowa / Stacja osobowa");
        }
        return;
    }

    const old = document.getElementById("ksiazkaSprawdModal");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "ksiazkaSprawdModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";

    // domyślnie wszystkie zaznaczone
    const selected = new Set(
        items.map(e => appState.ksiazkaWydarzen.findIndex(x => x.id === e.id)).filter(i => i >= 0)
    );
    overlay._selectedEntryIndexes = selected;

    const list = items.map(e => {
        const idx = appState.ksiazkaWydarzen.findIndex(x => x.id === e.id);
        const short = String(e.tekst || "").slice(0, 120);
        const pol = findMatchingPolecenieForEntry(e);
        const polLabel = pol
            ? `${escapeHtml(pol.Rodzaj)} – ${escapeHtml(pol.Nazwa || pol.OpisKrotki || "")}`
            : "—";
        return `
        <div id="ksiazkaSprawdEntry_${idx}"
             class="ksiazka-sprawd-entry selected"
             data-index="${idx}"
             onclick="ksiazkaSprawdzenieToggleEntry(${idx})"
             style="
                border: 2px solid #22c55e;
                background: rgba(34, 197, 94, 0.12);
                border-radius: 10px;
                padding: 10px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: border-color 0.15s, background 0.15s, opacity 0.15s;
             ">
            <div style="font-weight:600; color:#60a5fa;">${escapeHtml(e.godzinaStart || "—")} · ${escapeHtml(e.data || "")}</div>
            <div style="font-size:12px; color:#94a3b8; margin-top:2px;">${polLabel}</div>
            <div style="font-size:13px; color:#e2e8f0; margin-top:4px; white-space:pre-wrap;">${escapeHtml(short)}${(e.tekst || "").length > 120 ? "…" : ""}</div>
        </div>`;
    }).join("");

    overlay.innerHTML = `
        <div class="modal" style="max-width:560px;">
            <h2 style="margin-top:0;">Sprawdzenie – wybierz wpisy</h2>
            <p style="color:#94a3b8; font-size:14px; margin-bottom:12px;">
                Kliknij wpis, aby go odznaczyć / zaznaczyć.
                Zielone = zaznaczone, szare = odznaczone.
            </p>
            <div style="margin-bottom:12px; display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" class="btn-primary" style="padding:6px 12px; font-size:13px;" onclick="ksiazkaSprawdzenieZaznaczWszystkie(true)">Zaznacz wszystkie</button>
                <button type="button" class="btn-primary" style="padding:6px 12px; font-size:13px;" onclick="ksiazkaSprawdzenieZaznaczWszystkie(false)">Odznacz wszystkie</button>
            </div>
            <div style="max-height:360px; overflow:auto; margin-bottom:14px;">${list}</div>
            <div class="modal-actions">
                <button class="btn-success" onclick="ksiazkaSprawdzenieDalej()">Dalej – godziny</button>
                <button class="btn-danger" onclick="closeKsiazkaSprawdzenieModal()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function closeKsiazkaSprawdzenieModal() {
    const m = document.getElementById("ksiazkaSprawdModal");
    if (m) m.remove();
}

function ksiazkaSprawdzenieToggleEntry(idx) {
    const modal = document.getElementById("ksiazkaSprawdModal");
    if (!modal || !modal._selectedEntryIndexes) return;
    const set = modal._selectedEntryIndexes;
    const el = document.getElementById(`ksiazkaSprawdEntry_${idx}`);
    if (!el) return;

    if (set.has(idx)) {
        set.delete(idx);
        el.classList.remove("selected");
        el.style.borderColor = "#475569";
        el.style.background = "rgba(71, 85, 105, 0.25)";
        el.style.opacity = "0.65";
    } else {
        set.add(idx);
        el.classList.add("selected");
        el.style.borderColor = "#22c55e";
        el.style.background = "rgba(34, 197, 94, 0.12)";
        el.style.opacity = "1";
    }
}

function ksiazkaSprawdzenieZaznaczWszystkie(zaznacz) {
    const modal = document.getElementById("ksiazkaSprawdModal");
    if (!modal) return;
    if (!modal._selectedEntryIndexes) modal._selectedEntryIndexes = new Set();

    document.querySelectorAll(".ksiazka-sprawd-entry").forEach(el => {
        const idx = parseInt(el.getAttribute("data-index"), 10);
        if (zaznacz) {
            modal._selectedEntryIndexes.add(idx);
            el.classList.add("selected");
            el.style.borderColor = "#22c55e";
            el.style.background = "rgba(34, 197, 94, 0.12)";
            el.style.opacity = "1";
        } else {
            modal._selectedEntryIndexes.delete(idx);
            el.classList.remove("selected");
            el.style.borderColor = "#475569";
            el.style.background = "rgba(71, 85, 105, 0.25)";
            el.style.opacity = "0.65";
        }
    });
}

function ksiazkaSprawdzenieDalej() {
    const modal = document.getElementById("ksiazkaSprawdModal");
    if (!modal) return;

    const selected = modal._selectedEntryIndexes
        ? [...modal._selectedEntryIndexes]
        : [];
    if (!selected.length) {
        if (typeof showToast === "function") showToast("Zaznacz przynajmniej jeden wpis");
        else alert("Zaznacz przynajmniej jeden wpis");
        return;
    }

    ensureKsiazkaState();
    const items = [];
    for (const idx of selected) {
        const entry = appState.ksiazkaWydarzen[idx];
        if (!entry) continue;
        const pol = findMatchingPolecenieForEntry(entry);
        if (!pol) continue;
        items.push({
            Rodzaj: pol.Rodzaj,
            Nazwa: pol.Nazwa || pol.OpisKrotki || "",
            Linia: pol.Linia || "",
            KmOd: pol.KmOd || "",
            KmDo: pol.KmDo || "",
            _entryIndex: idx,
            _entryGodzina: entry.godzinaStart || ""
        });
    }

    if (!items.length) {
        if (typeof showToast === "function") showToast("Nie znaleziono pasujących poleceń do zaznaczonych wpisów");
        else alert("Nie znaleziono pasujących poleceń do zaznaczonych wpisów");
        return;
    }

    closeKsiazkaSprawdzenieModal();

    const startRounded = (typeof formatHHMM === "function" && typeof roundTo10Minutes === "function")
        ? formatHHMM(roundTo10Minutes(new Date()))
        : nowHHMM();

    const overlay = document.createElement("div");
    overlay.id = "ksiazkaSprawdModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay._items = items;

    let body = items.map((it, i) => {
        const startVal = it._entryGodzina || startRounded;
        const endVal = (typeof addHoursHHMM === "function")
            ? addHoursHHMM(startVal, 2)
            : startVal;
        return `
        <div style="border:1px solid #334155; border-radius:10px; padding:12px; margin-bottom:12px;">
            <div style="font-weight:600; margin-bottom:8px;">${escapeHtml(it.Rodzaj)} – ${escapeHtml(it.Nazwa)}</div>
            <div style="font-size:13px; color:#94a3b8; margin-bottom:8px;">
                Linia: ${escapeHtml(it.Linia)} | Km: ${escapeHtml(it.KmOd)} – ${escapeHtml(it.KmDo)}
            </div>
            <label>Godzina rozpoczęcia</label>
            <input type="text" id="ksSprawdGodzOd_${i}" value="${escapeHtml(startVal)}" placeholder="gg:mm"
                   style="width:100%; margin-bottom:8px;"
                   oninput="ksiazkaSprawdGodzOdChange(${i})">
            <label>Szacunkowa godzina zakończenia (+2h, edytowalna)</label>
            <input type="text" id="ksSprawdGodzDo_${i}" value="${escapeHtml(endVal)}" placeholder="gg:mm" style="width:100%;">
        </div>`;
    }).join("");

    overlay.innerHTML = `
        <div class="modal" style="max-width:560px;">
            <h2 style="margin-top:0;">Zaloguj sprawdzenie</h2>
            <p style="color:#94a3b8; font-size:14px;">
                Okno zbiorcze – dane (linia, nazwa, km) pobrane z polecenia.
                Uzupełnij tylko godziny.
            </p>
            ${body}
            <div class="modal-actions">
                <button class="btn-success" onclick="confirmKsiazkaSprawdzenie()">Zapisz do statystyk</button>
                <button class="btn-danger" onclick="closeKsiazkaSprawdzenieModal()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function ksiazkaSprawdGodzOdChange(idx) {
    const odEl = document.getElementById(`ksSprawdGodzOd_${idx}`);
    const doEl = document.getElementById(`ksSprawdGodzDo_${idx}`);
    if (!odEl || !doEl) return;
    if (typeof parseHHMM !== "function" || typeof addHoursHHMM !== "function" || typeof formatHHMM !== "function") return;
    const parsed = parseHHMM(odEl.value);
    if (!parsed) return;
    doEl.value = addHoursHHMM(formatHHMM(parsed), 2);
}

async function confirmKsiazkaSprawdzenie() {
    const modal = document.getElementById("ksiazkaSprawdModal");
    if (!modal) return;
    const items = modal._items || [];
    if (!items.length) return;

    for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const godzOd = (document.getElementById(`ksSprawdGodzOd_${idx}`)?.value || "").trim();
        const godzDo = (document.getElementById(`ksSprawdGodzDo_${idx}`)?.value || "").trim();
        if (!godzOd || !godzDo) {
            if (typeof showToast === "function") showToast("Uzupełnij godziny (gg:mm)");
            else alert("Uzupełnij godziny (gg:mm)");
            return;
        }
        if (typeof logSprawdzenie === "function") {
            await logSprawdzenie({
                rodzaj: it.Rodzaj,
                nazwa: it.Nazwa || "",
                linia: it.Linia || "",
                kmOd: it.KmOd || "",
                kmDo: it.KmDo || "",
                godzOd,
                godzDo
            });
        } else {
            if (!appState.statystyki) appState.statystyki = { interwencje: [], sprawdzenia: [] };
            if (!Array.isArray(appState.statystyki.sprawdzenia)) appState.statystyki.sprawdzenia = [];
            appState.statystyki.sprawdzenia.push({
                rodzaj: it.Rodzaj,
                nazwa: it.Nazwa || "",
                linia: it.Linia || "",
                kmOd: it.KmOd || "",
                kmDo: it.KmDo || "",
                godzOd,
                godzDo,
                data: todayPL(),
                createdAt: new Date().toISOString()
            });
        }
    }

    await saveState();
    closeKsiazkaSprawdzenieModal();
    if (typeof showToast === "function") showToast("✅ Zapisano sprawdzenia w statystykach");
    else alert("Zapisano sprawdzenia w statystykach");
}

// =====================================
// UWAGI – wybór wpisu → dodaje na końcu (nie nadpisuje) + edycja
// =====================================

function openKsiazkaUwagiPicker() {
    ensureKsiazkaState();
    const entries = sortEntriesOldestFirst(appState.ksiazkaWydarzen);
    if (!entries.length) {
        if (typeof showToast === "function") showToast("Brak wpisów w książce");
        else alert("Brak wpisów w książce");
        return;
    }

    const old = document.getElementById("ksiazkaUwagiPicker");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "ksiazkaUwagiPicker";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";

    const list = entries.map(e => {
        const idx = appState.ksiazkaWydarzen.findIndex(x => x.id === e.id);
        const short = String(e.tekst || "").slice(0, 80);
        return `
        <div style="border:1px solid #334155; border-radius:10px; padding:10px; margin-bottom:8px; cursor:pointer;"
             onclick="ksiazkaUwagiWybrano(${idx})">
            <div style="font-weight:600; color:#60a5fa;">${escapeHtml(e.godzinaStart || "—")} · ${escapeHtml(e.data || "")}</div>
            <div style="font-size:13px; color:#e2e8f0; margin-top:4px; white-space:pre-wrap;">${escapeHtml(short)}${(e.tekst || "").length > 80 ? "…" : ""}</div>
        </div>`;
    }).join("");

    overlay.innerHTML = `
        <div class="modal" style="max-width:560px;">
            <h2 style="margin-top:0;">Uwagi – wybierz wpis</h2>
            <p style="color:#94a3b8; font-size:14px; margin-bottom:12px;">
                Szablon uwagi zostanie <strong>dopisany na końcu</strong> wybranego wpisu (możesz edytować przed zapisem).
            </p>
            <div style="max-height:360px; overflow:auto;">${list}</div>
            <div class="modal-actions">
                <button class="btn-danger" onclick="closeKsiazkaUwagiPicker()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function closeKsiazkaUwagiPicker() {
    const m = document.getElementById("ksiazkaUwagiPicker");
    if (m) m.remove();
}

function ksiazkaUwagiWybrano(index) {
    closeKsiazkaUwagiPicker();
    window._ksiazkaUwagiEditIndex = index;
    ensureKsiazkaState();
    const entry = appState.ksiazkaWydarzen[index];
    if (!entry) return;

    if (typeof ensureUwagiState === "function") ensureUwagiState();

    const sz = (appState.uwagiSzablony) || {
        "MKK": "Przeprowadzono kontrolę dokumentów. MKK: @MKK.",
        "Pouczony": "Osoba została pouczona o obowiązujących przepisach.",
        "Legitymowany": "Dokonywano legitymowania osób. Sprawdzono tożsamość.",
        "Inne": ""
    };

    const old = document.getElementById("ksiazkaUwagiEditModal");
    if (old) old.remove();

    const types = Object.keys(sz).map(t => {
        const safe = JSON.stringify(sz[t] || "");
        return `<div class="line-pill" style="cursor:pointer;" onclick='ksiazkaUwagiDodajSzablon(${safe})'>${escapeHtml(t)}</div>`;
    }).join("");

    const base = String(entry.tekst || "");

    const overlay = document.createElement("div");
    overlay.id = "ksiazkaUwagiEditModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay.innerHTML = `
        <div class="modal" style="max-width:640px;">
            <h2 style="margin-top:0;">Uwagi do wpisu</h2>
            <p style="color:#94a3b8; font-size:13px; margin-bottom:10px;">
                Kliknij szablon (MKK / Pouczony / …) – dopisze się na końcu. Możesz też edytować ręcznie.
            </p>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">${types}</div>
            <label>Treść wpisu (edycja)</label>
            <textarea id="ksUwagiTekst" rows="10" style="width:100%; margin-bottom:14px; font-size:14px; line-height:1.45;">${escapeHtml(base)}</textarea>
            <div class="modal-actions">
                <button class="btn-success" onclick="confirmKsiazkaUwagi()">Zapisz do wpisu</button>
                <button class="btn-danger" onclick="closeKsiazkaUwagiEditModal()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function ksiazkaUwagiDodajSzablon(tekstSzablonu) {
    const ta = document.getElementById("ksUwagiTekst");
    if (!ta) return;
    const add = String(tekstSzablonu || "").trim();
    if (!add) return;
    const cur = ta.value || "";
    if (cur.trim()) {
        ta.value = cur.replace(/\s*$/, "") + "\n\n" + add;
    } else {
        ta.value = add;
    }
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
}

function closeKsiazkaUwagiEditModal() {
    const m = document.getElementById("ksiazkaUwagiEditModal");
    if (m) m.remove();
}

async function confirmKsiazkaUwagi() {
    const index = window._ksiazkaUwagiEditIndex;
    if (index == null || !appState.ksiazkaWydarzen[index]) return;

    const tekst = (document.getElementById("ksUwagiTekst")?.value || "");
    appState.ksiazkaWydarzen[index].tekst = tekst;
    await saveState();
    closeKsiazkaUwagiEditModal();
    renderKsiazka();
    if (typeof showToast === "function") showToast("✅ Zapisano uwagi do wpisu");
}

// =====================================
// EXPOSE
// =====================================
window.initKsiazka = initKsiazka;
window.renderKsiazka = renderKsiazka;
window.openKsiazkaSaveModal = openKsiazkaSaveModal;
window.closeKsiazkaSaveModal = closeKsiazkaSaveModal;
window.confirmSaveToKsiazka = confirmSaveToKsiazka;
window.toggleKsiazkaFilter = toggleKsiazkaFilter;
window.clearKsiazkaFilter = clearKsiazkaFilter;
window.oznaczZrobione = oznaczZrobione;
window.odznaczZrobione = odznaczZrobione;
window.usunWpisKsiazki = usunWpisKsiazki;
window.clearAllKsiazka = clearAllKsiazka;
window.kopiujWpisKsiazki = kopiujWpisKsiazki;
window.edytujWpisKsiazki = edytujWpisKsiazki;
window.insertTileToEdit = insertTileToEdit;
window.replaceAllFromTile = replaceAllFromTile;
window.closeKsiazkaEditModal = closeKsiazkaEditModal;
window.confirmEditKsiazka = confirmEditKsiazka;
window.openPlanSluzbyModal = openPlanSluzbyModal;
window.closePlanSluzbyModal = closePlanSluzbyModal;
window.confirmPlanSluzby = confirmPlanSluzby;
window.toggleKsiazkaFilterInne = toggleKsiazkaFilterInne;
window.exportKsiazkaFiltered = exportKsiazkaFiltered;
window.openKsiazkaSprawdzenieModal = openKsiazkaSprawdzenieModal;
window.closeKsiazkaSprawdzenieModal = closeKsiazkaSprawdzenieModal;
window.ksiazkaSprawdzenieToggleEntry = ksiazkaSprawdzenieToggleEntry;
window.ksiazkaSprawdzenieZaznaczWszystkie = ksiazkaSprawdzenieZaznaczWszystkie;
window.ksiazkaSprawdzenieDalej = ksiazkaSprawdzenieDalej;
window.ksiazkaSprawdGodzOdChange = ksiazkaSprawdGodzOdChange;
window.confirmKsiazkaSprawdzenie = confirmKsiazkaSprawdzenie;
window.openKsiazkaUwagiPicker = openKsiazkaUwagiPicker;
window.closeKsiazkaUwagiPicker = closeKsiazkaUwagiPicker;
window.ksiazkaUwagiWybrano = ksiazkaUwagiWybrano;
window.ksiazkaUwagiDodajSzablon = ksiazkaUwagiDodajSzablon;
window.closeKsiazkaUwagiEditModal = closeKsiazkaUwagiEditModal;
window.confirmKsiazkaUwagi = confirmKsiazkaUwagi;
