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
                <button class="btn-primary" onclick="openPlanSluzbyModal()">📋 Planowanie</button>
                <button class="btn-primary" onclick="openZapiszKsiazkeJakoSzablon()">💾 Zapisz książkę jako szablon</button>
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
// PLANOWANIE SŁUŻBY (szablony względne)
// =====================================

/** Draft edytowanego planu w modalu: [{ offsetMin, tekst, patrolIndex|null }] */
let _planDraft = [];
let _planEditTemplateId = null; // null = nowy

function ensurePlanSzablonyState() {
    if (!Array.isArray(appState.planSzablony)) {
        appState.planSzablony = [];
    }
}

function timeToMinutes(hhmm) {
    const p = parseTimeParts(hhmm);
    if (!p) return 0;
    return p.h * 60 + p.m;
}

function minutesToHHMM(mins) {
    let m = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(m / 60);
    const min = m % 60;
    return String(h).padStart(2, "0") + ":" + String(min).padStart(2, "0");
}

/** Data wpisu wg reguły nocnej (po 18:00 + godzina 0–11 → jutro) */
function resolveDataForGodzina(godzHHMM) {
    const parts = parseTimeParts(godzHHMM);
    let dataWpisu = todayPL();
    if (parts) {
        const now = new Date();
        const chosen = new Date();
        chosen.setHours(parts.h, parts.m, 0, 0);
        if (chosen < now && now.getHours() >= 18 && parts.h < 12) {
            dataWpisu = tomorrowPL();
        }
    }
    return dataWpisu;
}

function stripHtmlPlain(html) {
    return String(html || "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
}

function openPlanSluzbyModal() {
    ensurePlanSzablonyState();
    _planDraft = [];
    _planEditTemplateId = null;

    const old = document.getElementById("planSluzbyModal");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "planSluzbyModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    document.body.appendChild(overlay);
    renderPlanSluzbyModal();
}

function closePlanSluzbyModal() {
    const m = document.getElementById("planSluzbyModal");
    if (m) m.remove();
    _planDraft = [];
    _planEditTemplateId = null;
}

function renderPlanSluzbyModal() {
    const overlay = document.getElementById("planSluzbyModal");
    if (!overlay) return;
    ensurePlanSzablonyState();

    const szablony = appState.planSzablony || [];
    const patrole = appState.patrole || [];

    const szOptions = szablony.map((s, i) =>
        `<option value="${i}">${escapeHtml(s.nazwa || ("Szablon " + (i + 1)))} (${(s.rekordy || []).length} pkt)</option>`
    ).join("");

    const patrolOpts = `<option value="">— bez patrolu —</option>` +
        patrole.map((p, i) => `<option value="${i}">${escapeHtml(p.nazwa || ("Patrol " + (i + 1)))}</option>`).join("");

    const zglOpts = (appState.zgloszenia?.rows || []).map((r, i) => {
        const label = (r.OpisKrotki || r.Opis || ("Zgł. " + (i + 1))).slice(0, 50);
        return `<option value="zgl_${i}">${escapeHtml(label)}</option>`;
    }).join("");

    const polOpts = (appState.polecenia?.rows || []).map((r, i) => {
        const label = (r.OpisKrotki || r.Opis || ("Pol. " + (i + 1))).slice(0, 50);
        return `<option value="pol_${i}">${escapeHtml(label)}</option>`;
    }).join("");

    let draftHtml = "";
    if (_planDraft.length === 0) {
        draftHtml = `<div style="color:#64748b; padding:12px 0;">Brak punktów – dodaj rekord lub wczytaj szablon.</div>`;
    } else {
        let acc = 0;
        draftHtml = _planDraft.map((r, idx) => {
            acc += (idx === 0 ? 0 : (Number(r.offsetMin) || 0));
            const godzPreview = minutesToHHMM(acc); // preview od 00:00 – przy starcie się przesunie
            const patrolName = (r.patrolIndex == null || r.patrolIndex === "")
                ? "bez patrolu"
                : getPatrolName(Number(r.patrolIndex));
            return `
            <div style="border:1px solid #334155; border-radius:10px; padding:10px; margin-bottom:8px; background:#0f172a;">
                <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                    <div style="font-weight:600; color:#60a5fa;">
                        #${idx + 1}
                        ${idx === 0 ? "(start)" : ("+" + (Number(r.offsetMin) || 0) + " min")}
                        <span style="color:#94a3b8; font-weight:500; font-size:12px;"> · od startu ~${godzPreview}</span>
                    </div>
                    <button type="button" class="btn-danger" style="padding:3px 8px; font-size:12px;" onclick="planDraftUsun(${idx})">Usuń</button>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                    ${idx === 0 ? `<input type="hidden" class="plan-offset" data-idx="${idx}" value="0">` : `
                    <div style="min-width:100px;">
                        <label style="font-size:12px;">+ min od poprzedniego</label>
                        <input type="number" class="plan-offset" data-idx="${idx}" value="${Number(r.offsetMin) || 0}" min="0" step="5"
                               style="width:100%;" onchange="planDraftUpdateOffset(${idx}, this.value)">
                    </div>`}
                    <div style="flex:1; min-width:140px;">
                        <label style="font-size:12px;">Patrol</label>
                        <select class="plan-patrol" data-idx="${idx}" style="width:100%;" onchange="planDraftUpdatePatrol(${idx}, this.value)">
                            ${patrole.map((p, i) =>
                                `<option value="${i}" ${Number(r.patrolIndex) === i ? "selected" : ""}>${escapeHtml(p.nazwa || ("Patrol " + (i + 1)))}</option>`
                            ).join("")}
                            <option value="" ${r.patrolIndex == null || r.patrolIndex === "" ? "selected" : ""}>— bez patrolu —</option>
                        </select>
                    </div>
                </div>
                <label style="font-size:12px;">Treść</label>
                <textarea class="plan-tekst" data-idx="${idx}" rows="2" style="width:100%; font-size:13px;"
                          onchange="planDraftUpdateTekst(${idx}, this.value)">${escapeHtml(r.tekst || "")}</textarea>
            </div>`;
        }).join("");
    }

    overlay.innerHTML = `
        <div class="modal" style="max-width:720px; max-height:92vh; overflow:auto;">
            <h2 style="margin-top:0;">📋 Planowanie służby</h2>
            <p style="color:#94a3b8; font-size:13px; margin-bottom:12px;">
                Szablon = kolejne rekordy z offsetem <strong>od poprzedniego</strong>.
                Przy starcie podajesz godzinę rozpoczęcia – reszta się przelicza.
            </p>

            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; align-items:flex-end;">
                <div style="flex:1; min-width:180px;">
                    <label>Szablon</label>
                    <select id="planSzablonSelect" style="width:100%;">
                        <option value="">— nowy / pusty —</option>
                        ${szOptions}
                    </select>
                </div>
                <button type="button" class="btn-primary" onclick="planWczytajSzablon()">Wczytaj</button>
                <button type="button" class="btn-success" onclick="planZapiszJakoSzablon()">Zapisz jako szablon</button>
                <button type="button" class="btn-danger" onclick="planUsunSzablon()">Usuń szablon</button>
            </div>

            <h3 style="margin:12px 0 8px;">Punkty planu</h3>
            <div id="planDraftList">${draftHtml}</div>

            <div style="border:1px dashed #334155; border-radius:10px; padding:12px; margin:14px 0;">
                <div style="font-weight:600; margin-bottom:8px;">Dodaj punkt</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                    <div style="min-width:100px;">
                        <label style="font-size:12px;">+ min (0 = start / od poprz.)</label>
                        <input type="number" id="planAddOffset" value="${_planDraft.length === 0 ? 0 : 60}" min="0" step="5" style="width:100%;">
                    </div>
                    <div style="flex:1; min-width:120px;">
                        <label style="font-size:12px;">Patrol</label>
                        <select id="planAddPatrol" style="width:100%;">${patrolOpts}</select>
                    </div>
                </div>
                <div style="margin-bottom:8px;">
                    <label style="font-size:12px;">Treść (ręcznie)</label>
                    <textarea id="planAddTekst" rows="2" style="width:100%;" placeholder="Opis wpisu…"></textarea>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                    <div style="flex:1; min-width:140px;">
                        <label style="font-size:12px;">lub ze Zgłoszeń</label>
                        <select id="planAddZgl" style="width:100%;">
                            <option value="">—</option>${zglOpts}
                        </select>
                    </div>
                    <div style="flex:1; min-width:140px;">
                        <label style="font-size:12px;">lub z Poleceń</label>
                        <select id="planAddPol" style="width:100%;">
                            <option value="">—</option>${polOpts}
                        </select>
                    </div>
                </div>
                <button type="button" class="btn-success" onclick="planDraftDodaj()">+ Dodaj punkt</button>
            </div>

            <div style="border:1px dashed #334155; border-radius:10px; padding:12px; margin:14px 0;">
                <div style="font-weight:600; margin-bottom:8px;">Cykliczne zgłoszenia</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                    <div style="min-width:90px;">
                        <label style="font-size:12px;">Pierwszy +min</label>
                        <input type="number" id="planCycOffset" value="60" min="0" step="5" style="width:100%;">
                    </div>
                    <div style="min-width:90px;">
                        <label style="font-size:12px;">Co ile min</label>
                        <input type="number" id="planCycInterwal" value="60" min="5" step="5" style="width:100%;">
                    </div>
                    <div style="min-width:90px;">
                        <label style="font-size:12px;">Ile razy</label>
                        <input type="number" id="planCycIle" value="8" min="1" max="48" style="width:100%;">
                    </div>
                    <div style="flex:1; min-width:120px;">
                        <label style="font-size:12px;">Patrol</label>
                        <select id="planCycPatrol" style="width:100%;">${patrolOpts}</select>
                    </div>
                </div>
                <textarea id="planCycTekst" rows="2" style="width:100%; margin-bottom:8px;" placeholder="Treść cykliczna (lub wybierz zgł./pol. poniżej)"></textarea>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                    <select id="planCycZgl" style="flex:1; min-width:120px;"><option value="">Zgłoszenie —</option>${zglOpts}</select>
                    <select id="planCycPol" style="flex:1; min-width:120px;"><option value="">Polecenie —</option>${polOpts}</select>
                </div>
                <button type="button" class="btn-primary" onclick="planDraftDodajCykliczne()">+ Dodaj serię cykliczną</button>
            </div>

            <div style="border-top:1px solid #334155; padding-top:14px; margin-top:8px;">
                <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; margin-bottom:12px;">
                    <div style="min-width:140px;">
                        <label>Godzina startu planu</label>
                        <input type="time" id="planStartGodz" value="07:00" style="width:100%;">
                    </div>
                    <button type="button" class="btn-primary" onclick="planPodglad()">Podgląd godzin</button>
                </div>
                <div id="planPodgladBox" style="display:none; background:#0f172a; border:1px solid #334155; border-radius:10px; padding:10px; margin-bottom:12px; max-height:160px; overflow:auto; font-size:13px; white-space:pre-wrap;"></div>
                <div class="modal-actions">
                    <button class="btn-success" onclick="planZapiszDoKsiazki()">Zapisz do Książki</button>
                    <button class="btn-danger" onclick="closePlanSluzbyModal()">Anuluj</button>
                </div>
            </div>
        </div>
    `;
}

function planDraftSyncFromUI() {
    // offsets/teksty already updated via onchange; ensure array consistency
}

function planDraftUpdateOffset(idx, val) {
    if (!_planDraft[idx]) return;
    _planDraft[idx].offsetMin = Math.max(0, parseInt(val, 10) || 0);
    if (idx === 0) _planDraft[idx].offsetMin = 0;
}

function planDraftUpdatePatrol(idx, val) {
    if (!_planDraft[idx]) return;
    _planDraft[idx].patrolIndex = (val === "" || val == null) ? null : parseInt(val, 10);
}

function planDraftUpdateTekst(idx, val) {
    if (!_planDraft[idx]) return;
    _planDraft[idx].tekst = val;
}

function planDraftUsun(idx) {
    _planDraft.splice(idx, 1);
    if (_planDraft.length) _planDraft[0].offsetMin = 0;
    renderPlanSluzbyModal();
}

function planResolveAddTekst(tekstId, zglId, polId) {
    let t = (document.getElementById(tekstId)?.value || "").trim();
    if (t) return t;
    const zgl = document.getElementById(zglId)?.value || "";
    const pol = document.getElementById(polId)?.value || "";
    if (zgl.startsWith("zgl_")) {
        const i = parseInt(zgl.slice(4), 10);
        const row = appState.zgloszenia?.rows?.[i];
        if (row) return stripHtmlPlain(row.Opis || row.OpisKrotki || "");
    }
    if (pol.startsWith("pol_")) {
        const i = parseInt(pol.slice(4), 10);
        const row = appState.polecenia?.rows?.[i];
        if (row) return stripHtmlPlain(row.Opis || row.OpisKrotki || "");
    }
    return "";
}

function planDraftDodaj() {
    const offset = _planDraft.length === 0 ? 0 : Math.max(0, parseInt(document.getElementById("planAddOffset")?.value || "0", 10) || 0);
    const patrolVal = document.getElementById("planAddPatrol")?.value;
    const patrolIndex = (patrolVal === "" || patrolVal == null) ? null : parseInt(patrolVal, 10);
    const tekst = planResolveAddTekst("planAddTekst", "planAddZgl", "planAddPol");
    if (!tekst) {
        if (typeof showToast === "function") showToast("Podaj treść lub wybierz zgłoszenie/polecenie");
        else alert("Podaj treść lub wybierz zgłoszenie/polecenie");
        return;
    }
    _planDraft.push({ offsetMin: _planDraft.length === 0 ? 0 : offset, tekst, patrolIndex });
    renderPlanSluzbyModal();
}

function planDraftDodajCykliczne() {
    const firstOff = Math.max(0, parseInt(document.getElementById("planCycOffset")?.value || "0", 10) || 0);
    const interwal = Math.max(5, parseInt(document.getElementById("planCycInterwal")?.value || "60", 10) || 60);
    const ile = Math.min(48, Math.max(1, parseInt(document.getElementById("planCycIle")?.value || "1", 10) || 1));
    const patrolVal = document.getElementById("planCycPatrol")?.value;
    const patrolIndex = (patrolVal === "" || patrolVal == null) ? null : parseInt(patrolVal, 10);
    let tekst = planResolveAddTekst("planCycTekst", "planCycZgl", "planCycPol");
    if (!tekst) tekst = "Zgłoszenie sytuacji / lokalizacji";

    for (let i = 0; i < ile; i++) {
        const off = (_planDraft.length === 0 && i === 0) ? 0 : (i === 0 ? firstOff : interwal);
        _planDraft.push({ offsetMin: off, tekst, patrolIndex });
    }
    renderPlanSluzbyModal();
}

function planWczytajSzablon() {
    ensurePlanSzablonyState();
    const sel = document.getElementById("planSzablonSelect")?.value;
    if (sel === "" || sel == null) {
        _planDraft = [];
        _planEditTemplateId = null;
        renderPlanSluzbyModal();
        return;
    }
    const i = parseInt(sel, 10);
    const s = appState.planSzablony[i];
    if (!s) return;
    _planEditTemplateId = s.id;
    _planDraft = (s.rekordy || []).map(r => ({
        offsetMin: Number(r.offsetMin) || 0,
        tekst: r.tekst || "",
        patrolIndex: (r.patrolIndex == null || r.patrolIndex === "") ? null : Number(r.patrolIndex)
    }));
    if (_planDraft.length) _planDraft[0].offsetMin = 0;
    renderPlanSluzbyModal();
    if (typeof showToast === "function") showToast("Wczytano: " + (s.nazwa || "szablon"));
}

async function planZapiszJakoSzablon() {
    ensurePlanSzablonyState();
    if (!_planDraft.length) {
        if (typeof showToast === "function") showToast("Brak punktów do zapisania");
        else alert("Brak punktów do zapisania");
        return;
    }
    // sync tekst from textareas if still open
    document.querySelectorAll(".plan-tekst").forEach(ta => {
        const idx = parseInt(ta.getAttribute("data-idx"), 10);
        if (_planDraft[idx]) _planDraft[idx].tekst = ta.value;
    });

    let nazwa = prompt("Nazwa szablonu:", "");
    if (nazwa == null) return;
    nazwa = String(nazwa).trim() || ("Szablon " + new Date().toLocaleString("pl-PL"));

    const rekordy = _planDraft.map((r, idx) => ({
        offsetMin: idx === 0 ? 0 : (Number(r.offsetMin) || 0),
        tekst: r.tekst || "",
        patrolIndex: r.patrolIndex == null ? null : Number(r.patrolIndex)
    }));

    if (_planEditTemplateId) {
        const existing = appState.planSzablony.find(s => s.id === _planEditTemplateId);
        if (existing) {
            existing.nazwa = nazwa;
            existing.rekordy = rekordy;
            await saveState();
            if (typeof showToast === "function") showToast("✅ Zaktualizowano szablon");
            renderPlanSluzbyModal();
            return;
        }
    }

    appState.planSzablony.push({
        id: Date.now() + Math.random().toString(36).slice(2),
        nazwa,
        rekordy,
        createdAt: new Date().toISOString()
    });
    await saveState();
    if (typeof showToast === "function") showToast("✅ Zapisano szablon");
    renderPlanSluzbyModal();
}

async function planUsunSzablon() {
    ensurePlanSzablonyState();
    const sel = document.getElementById("planSzablonSelect")?.value;
    if (sel === "" || sel == null) {
        if (typeof showToast === "function") showToast("Wybierz szablon do usunięcia");
        return;
    }
    const i = parseInt(sel, 10);
    if (!appState.planSzablony[i]) return;
    if (!confirm("Usunąć szablon „" + (appState.planSzablony[i].nazwa || "") + "”?")) return;
    appState.planSzablony.splice(i, 1);
    _planEditTemplateId = null;
    await saveState();
    renderPlanSluzbyModal();
}

function planBuildAbsoluteTimes(startHHMM) {
    const startMin = timeToMinutes(startHHMM);
    let acc = startMin;
    return _planDraft.map((r, idx) => {
        if (idx > 0) acc += (Number(r.offsetMin) || 0);
        return {
            godzinaStart: minutesToHHMM(acc),
            tekst: r.tekst || "",
            patrole: (r.patrolIndex == null || r.patrolIndex === "") ? [] : [Number(r.patrolIndex)]
        };
    });
}

function planPodglad() {
    if (!_planDraft.length) {
        if (typeof showToast === "function") showToast("Brak punktów");
        return;
    }
    document.querySelectorAll(".plan-tekst").forEach(ta => {
        const idx = parseInt(ta.getAttribute("data-idx"), 10);
        if (_planDraft[idx]) _planDraft[idx].tekst = ta.value;
    });
    const start = document.getElementById("planStartGodz")?.value || "07:00";
    const abs = planBuildAbsoluteTimes(start);
    const box = document.getElementById("planPodgladBox");
    if (!box) return;
    box.style.display = "block";
    box.textContent = abs.map(p => {
        const pn = (p.patrole && p.patrole.length) ? getPatrolName(p.patrole[0]) : "bez patrolu";
        return p.godzinaStart + "  [" + pn + "]\n" + (p.tekst || "").slice(0, 120);
    }).join("\n\n");
}

async function planZapiszDoKsiazki() {
    if (!_planDraft.length) {
        if (typeof showToast === "function") showToast("Brak punktów w planie");
        else alert("Brak punktów w planie");
        return;
    }
    document.querySelectorAll(".plan-tekst").forEach(ta => {
        const idx = parseInt(ta.getAttribute("data-idx"), 10);
        if (_planDraft[idx]) _planDraft[idx].tekst = ta.value;
    });

    const start = document.getElementById("planStartGodz")?.value || "07:00";
    const abs = planBuildAbsoluteTimes(start);
    ensureKsiazkaState();

    const hasAny = (appState.ksiazkaWydarzen || []).length > 0;
    let mode = "dopisz";
    if (hasAny) {
        const wybor = prompt(
            "W Książce są już wpisy.\n\nWpisz:\n  D = dopisz do istniejących\n  N = nadpisz CAŁĄ książkę (usuń wszystkie i wstaw plan)\n\n(Anuluj = przerwij)",
            "D"
        );
        if (wybor == null) return;
        const w = String(wybor).trim().toLowerCase();
        if (w === "n" || w === "nadpisz") mode = "nadpisz";
        else mode = "dopisz";
    }

    if (mode === "nadpisz") {
        appState.ksiazkaWydarzen = [];
    }

    abs.forEach(p => {
        appState.ksiazkaWydarzen.push({
            id: Date.now() + Math.random().toString(36).slice(2),
            data: resolveDataForGodzina(p.godzinaStart),
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
        showToast("✅ Zapisano plan (" + abs.length + " pkt, " + mode + ")");
    } else {
        alert("Zapisano plan: " + abs.length + " punktów");
    }
    if (document.getElementById("ksiazkaContainer")) renderKsiazka();
}

// -------------------------------------
// Zapisz książkę jako szablon (grupowanie patroli)
// -------------------------------------

function openZapiszKsiazkeJakoSzablon() {
    ensureKsiazkaState();
    ensurePlanSzablonyState();
    const entries = sortEntriesOldestFirst(appState.ksiazkaWydarzen || []);
    if (!entries.length) {
        if (typeof showToast === "function") showToast("Książka jest pusta");
        else alert("Książka jest pusta");
        return;
    }

    // Grupy wg klucza patrolu (posortowane indeksy albo "none")
    const groupsMap = new Map();
    entries.forEach(e => {
        const pats = Array.isArray(e.patrole) ? [...e.patrole].map(Number).filter(n => Number.isFinite(n)).sort((a, b) => a - b) : [];
        const key = pats.length ? pats.join(",") : "none";
        if (!groupsMap.has(key)) {
            groupsMap.set(key, {
                key,
                oldIndexes: pats,
                label: pats.length ? pats.map(i => getPatrolName(i)).join(", ") : "Bez patrolu",
                entries: []
            });
        }
        groupsMap.get(key).entries.push(e);
    });

    const groups = [...groupsMap.values()];

    const old = document.getElementById("planSaveTplModal");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "planSaveTplModal";
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay._groups = groups;
    overlay._allEntries = entries;

    const patrole = appState.patrole || [];
    const patrolOpts = `<option value="">— bez patrolu —</option>` +
        patrole.map((p, i) => `<option value="${i}">${escapeHtml(p.nazwa || ("Patrol " + (i + 1)))}</option>`).join("");

    const groupsHtml = groups.map((g, gi) => {
        const list = g.entries.map(e =>
            `<div style="font-size:12px; color:#94a3b8; padding:2px 0;">${escapeHtml(e.godzinaStart || "—")} · ${escapeHtml(String(e.tekst || "").slice(0, 80))}</div>`
        ).join("");
        const defaultSel = g.key === "none" ? "" : (g.oldIndexes[0] != null ? String(g.oldIndexes[0]) : "");
        return `
        <div style="border:1px solid #334155; border-radius:10px; padding:12px; margin-bottom:10px;">
            <div style="font-weight:600; margin-bottom:6px;">Grupa ${gi + 1}: ${escapeHtml(g.label)} <span style="color:#94a3b8; font-weight:500;">(${g.entries.length} wpisów)</span></div>
            <div style="max-height:100px; overflow:auto; margin-bottom:8px;">${list}</div>
            <label style="font-size:12px;">Przypisz do aktualnego patrolu</label>
            <select class="plan-group-map" data-gkey="${escapeHtml(g.key)}" style="width:100%;">
                ${patrolOpts.replace(`value="${defaultSel}"`, `value="${defaultSel}" selected`)}
            </select>
        </div>`;
    }).join("");

    overlay.innerHTML = `
        <div class="modal" style="max-width:600px; max-height:92vh; overflow:auto;">
            <h2 style="margin-top:0;">💾 Zapisz książkę jako szablon</h2>
            <p style="color:#94a3b8; font-size:13px; margin-bottom:12px;">
                Wpisy pogrupowane według patroli z książki. Przypisz każdą grupę do <strong>aktualnego</strong> patrolu
                (nazwy mogły się zmienić). Offsety liczone od poprzedniego wpisu w kolejności czasu.
            </p>
            <div style="margin-bottom:12px;">
                <label>Nazwa szablonu</label>
                <input type="text" id="planSaveTplNazwa" value="Służba ${escapeHtml(todayPL())}" style="width:100%;">
            </div>
            ${groupsHtml}
            <div class="modal-actions">
                <button class="btn-success" onclick="confirmZapiszKsiazkeJakoSzablon()">Zapisz szablon</button>
                <button class="btn-danger" onclick="closeZapiszKsiazkeJakoSzablon()">Anuluj</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // fix selected options (replace trick may fail) – set via JS
    groups.forEach(g => {
        const sel = overlay.querySelector(`.plan-group-map[data-gkey="${g.key}"]`);
        if (!sel) return;
        if (g.key === "none") sel.value = "";
        else if (g.oldIndexes[0] != null) sel.value = String(g.oldIndexes[0]);
    });
}

function closeZapiszKsiazkeJakoSzablon() {
    const m = document.getElementById("planSaveTplModal");
    if (m) m.remove();
}

async function confirmZapiszKsiazkeJakoSzablon() {
    const modal = document.getElementById("planSaveTplModal");
    if (!modal) return;
    const entries = modal._allEntries || [];
    if (!entries.length) return;

    // map group key -> patrolIndex|null
    const map = {};
    modal.querySelectorAll(".plan-group-map").forEach(sel => {
        const k = sel.getAttribute("data-gkey");
        const v = sel.value;
        map[k] = (v === "" || v == null) ? null : parseInt(v, 10);
    });

    const rekordy = [];
    let prevMin = null;
    entries.forEach((e, idx) => {
        const pats = Array.isArray(e.patrole) ? [...e.patrole].map(Number).filter(n => Number.isFinite(n)).sort((a, b) => a - b) : [];
        const key = pats.length ? pats.join(",") : "none";
        const patrolIndex = map.hasOwnProperty(key) ? map[key] : null;

        const curMin = timeToMinutes(e.godzinaStart || "00:00");
        let offsetMin = 0;
        if (idx === 0) {
            offsetMin = 0;
        } else {
            // różnica od poprzedniego; obsługa przejścia przez północ
            let diff = curMin - prevMin;
            if (diff < 0) diff += 24 * 60;
            offsetMin = diff;
        }
        prevMin = curMin;

        rekordy.push({
            offsetMin,
            tekst: e.tekst || "",
            patrolIndex
        });
    });

    const nazwa = (document.getElementById("planSaveTplNazwa")?.value || "").trim() || ("Służba " + todayPL());
    ensurePlanSzablonyState();
    appState.planSzablony.push({
        id: Date.now() + Math.random().toString(36).slice(2),
        nazwa,
        rekordy,
        createdAt: new Date().toISOString(),
        zKsiazki: true
    });
    await saveState();
    closeZapiszKsiazkeJakoSzablon();
    if (typeof showToast === "function") showToast("✅ Zapisano szablon „" + nazwa + "” (" + rekordy.length + " pkt)");
    else alert("Zapisano szablon: " + nazwa);
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
window.renderPlanSluzbyModal = renderPlanSluzbyModal;
window.planDraftUpdateOffset = planDraftUpdateOffset;
window.planDraftUpdatePatrol = planDraftUpdatePatrol;
window.planDraftUpdateTekst = planDraftUpdateTekst;
window.planDraftUsun = planDraftUsun;
window.planDraftDodaj = planDraftDodaj;
window.planDraftDodajCykliczne = planDraftDodajCykliczne;
window.planWczytajSzablon = planWczytajSzablon;
window.planZapiszJakoSzablon = planZapiszJakoSzablon;
window.planUsunSzablon = planUsunSzablon;
window.planPodglad = planPodglad;
window.planZapiszDoKsiazki = planZapiszDoKsiazki;
window.openZapiszKsiazkeJakoSzablon = openZapiszKsiazkeJakoSzablon;
window.closeZapiszKsiazkeJakoSzablon = closeZapiszKsiazkeJakoSzablon;
window.confirmZapiszKsiazkeJakoSzablon = confirmZapiszKsiazkeJakoSzablon;
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
