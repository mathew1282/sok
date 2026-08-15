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

function parseHHMM(str) {
    const m = String(str || "").trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    const d = new Date();
    d.setHours(h, min, 0, 0);
    return d;
}

function isOverdue(entry) {
    if (entry.zrobione) return false;
    if (!entry.godzinaPlanowana) return false;
    const plan = parseHHMM(entry.godzinaPlanowana);
    if (!plan) return false;
    return new Date() > plan;
}

function getPatrolName(index) {
    const p = appState.patrole?.[index];
    return (p && p.nazwa) ? p.nazwa : ("Patrol " + (index + 1));
}

// =====================================
// MODAL PO GENERUJ WPIS
// =====================================

function openKsiazkaSaveModal(tekst, patrolIndexes) {
    ensureKsiazkaState();

    const old = document.getElementById("ksiazkaSaveModal");
    if (old) old.remove();

    const now = nowHHMM();
    const planDate = new Date();
    planDate.setHours(planDate.getHours() + 1);
    const planDefault = planDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

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

            <div style="display:flex; gap:16px; margin-bottom:14px; flex-wrap:wrap;">
                <div style="flex:1; min-width:140px;">
                    <label>Godzina rozpoczęcia</label>
                    <input type="time" id="ksiazkaGodzStart" value="${now}" style="width:100%;">
                </div>
                <div style="flex:1; min-width:140px;">
                    <label>Planowane zakończenie / następne zgłoszenie</label>
                    <input type="time" id="ksiazkaGodzPlan" value="${planDefault}" style="width:100%;">
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
    const godzPlan = document.getElementById("ksiazkaGodzPlan")?.value || "";

    ensureKsiazkaState();

    appState.ksiazkaWydarzen.push({
        id: Date.now() + Math.random().toString(36).slice(2),
        data: todayPL(),
        godzinaStart: godzStart,
        godzinaPlanowana: godzPlan,
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

function initKsiazka() {
    ensureKsiazkaState();
    ksiazkaFilterPatrole = [];
    renderKsiazka();

    if (window._ksiazkaInterval) clearInterval(window._ksiazkaInterval);
    window._ksiazkaInterval = setInterval(() => {
        if (document.getElementById("ksiazkaContainer")) {
            renderKsiazka();
        }
    }, 30000);
}

function toggleKsiazkaFilter(patrolIndex) {
    const pos = ksiazkaFilterPatrole.indexOf(patrolIndex);
    if (pos > -1) ksiazkaFilterPatrole.splice(pos, 1);
    else ksiazkaFilterPatrole.push(patrolIndex);
    renderKsiazka();
}

function clearKsiazkaFilter() {
    ksiazkaFilterPatrole = [];
    renderKsiazka();
}

function renderKsiazka() {
    const container = document.getElementById("ksiazkaContainer");
    if (!container) return;
    ensureKsiazkaState();

    const allEntries = [...appState.ksiazkaWydarzen].reverse();
    const patrole = appState.patrole || [];

    let filtered = allEntries;
    if (ksiazkaFilterPatrole.length > 0) {
        filtered = allEntries.filter(e =>
            (e.patrole || []).some(p => ksiazkaFilterPatrole.includes(p))
        );
    }

    let columns = [];
    if (ksiazkaFilterPatrole.length > 0) {
        columns = ksiazkaFilterPatrole.map(idx => ({
            key: idx,
            name: getPatrolName(idx),
            entries: filtered.filter(e => (e.patrole || []).includes(idx))
        }));
    } else {
        const usedIndexes = new Set();
        filtered.forEach(e => (e.patrole || []).forEach(p => usedIndexes.add(p)));

        columns = [...usedIndexes].sort((a, b) => a - b).map(idx => ({
            key: idx,
            name: getPatrolName(idx),
            entries: filtered.filter(e => (e.patrole || []).includes(idx))
        }));

        const without = filtered.filter(e => !e.patrole || e.patrole.length === 0);
        if (without.length) {
            columns.push({
                key: "none",
                name: "Bez patrolu",
                entries: without
            });
        }
    }

    if (columns.length === 0) {
        columns = [{ key: "empty", name: "Brak wpisów", entries: [] }];
    }

    let html = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
            <h2 style="margin:0;">📖 Książka wydarzeń</h2>
            <button class="btn-primary" onclick="openPlanSluzbyModal()" style="margin-right:8px;">📅 Służba dzienna – szablon</button>
            <button class="btn-danger" onclick="clearAllKsiazka()">Kasuj wszystkie</button>
        </div>

        <div style="margin-bottom:18px;">
            <div style="font-size:14px; color:#94a3b8; margin-bottom:8px;">Filtruj po patrolach (kliknij aby włączyć/wyłączyć):</div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                <div class="line-pill ${ksiazkaFilterPatrole.length === 0 ? "active" : ""}" onclick="clearKsiazkaFilter()" style="cursor:pointer;">
                    Wszystkie
                </div>
                ${patrole.map((p, idx) => `
                    <div class="line-pill ${ksiazkaFilterPatrole.includes(idx) ? "active" : ""}"
                         onclick="toggleKsiazkaFilter(${idx})" style="cursor:pointer;">
                        ${escapeHtml(p.nazwa || ("Patrol " + (idx + 1)))}
                    </div>
                `).join("")}
            </div>
        </div>

        <div style="display:flex; gap:16px; overflow-x:auto; align-items:flex-start;">
    `;

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
                const overdue = isOverdue(entry);
                const globalIdx = appState.ksiazkaWydarzen.findIndex(e => e.id === entry.id);

                html += `
                <div style="
                    background:${overdue ? "rgba(220,38,38,0.15)" : "#0f172a"};
                    border:1px solid ${overdue ? "#dc2626" : "#334155"};
                    border-radius:10px;
                    padding:12px;
                    margin-bottom:10px;
                    ${overdue ? "box-shadow:0 0 0 1px #dc2626;" : ""}
                ">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:13px;">
                        <span style="color:#94a3b8;">${escapeHtml(entry.data)} · ${escapeHtml(entry.godzinaStart || "—")}</span>
                        <span style="font-weight:600; color:${overdue ? "#f87171" : "#94a3b8"};">
                            → ${escapeHtml(entry.godzinaPlanowana || "—")}
                            ${overdue ? " ⚠" : ""}
                            ${entry.zrobione ? " ✅" : ""}
                        </span>
                    </div>
                    <div style="font-size:13.5px; line-height:1.45; white-space:pre-wrap; color:#e2e8f0; margin-bottom:10px;">
                        ${escapeHtml(entry.tekst)}
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${!entry.zrobione ? `
                            <button class="btn-success" style="padding:5px 10px; font-size:12px;" onclick="oznaczZrobione(${globalIdx})">Zrobione</button>
                        ` : `
                            <button class="btn-primary" style="padding:5px 10px; font-size:12px;" onclick="odznaczZrobione(${globalIdx})">Cofnij zrobione</button>
                        `}
                        <button class="btn-primary" style="padding:5px 10px; font-size:12px;" onclick="kopiujWpisKsiazki(${globalIdx})">Kopiuj</button>
                        <button class="btn-danger" style="padding:5px 10px; font-size:12px;" onclick="usunWpisKsiazki(${globalIdx})">Kasuj</button>
                    </div>
                </div>
                `;
            });
        }

        html += `</div>`;
    });

    html += `
        </div>
    </div>
    `;

    container.innerHTML = html;
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

// =====================================
// POMOCNICZE
// =====================================

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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
    const p = parseHHMM(hhmm);
    if (!p) return 0;
    return p.getHours() * 60 + p.getMinutes();
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

    // Treść cyklicznych zgłoszeń
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

    punkty.push({
        godzinaStart: przyjecie,
        godzinaPlanowana: odprawa,
        tekst: "Przyjęcie służby",
        patrole: []
    });
    punkty.push({
        godzinaStart: odprawa,
        godzinaPlanowana: rozdysp,
        tekst: "Odprawa",
        patrole: []
    });
    punkty.push({
        godzinaStart: rozdysp,
        godzinaPlanowana: pierwsze,
        tekst: "Rozdysponowanie patroli",
        patrole: [...patrolIndexes]
    });

    let cur = timeToMinutes(pierwsze);
    const koniec = timeToMinutes(zdanie);

    while (cur < koniec) {
        const startHH = minutesToHHMM(cur);
        const next = cur + interwal;
        const planHH = minutesToHHMM(Math.min(next, koniec));

        if (patrolIndexes.length === 0) {
            punkty.push({
                godzinaStart: startHH,
                godzinaPlanowana: planHH,
                tekst: trescCykliczna || "Zgłoszenie sytuacji / lokalizacji patroli",
                patrole: []
            });
        } else {
            patrolIndexes.forEach(idx => {
                const base = trescCykliczna || ("Zgłoszenie – " + getPatrolName(idx));
                punkty.push({
                    godzinaStart: startHH,
                    godzinaPlanowana: planHH,
                    tekst: base,
                    patrole: [idx]
                });
            });
        }
        cur = next;
    }

    punkty.push({
        godzinaStart: zdanie,
        godzinaPlanowana: zdanie,
        tekst: "Zdanie służby",
        patrole: []
    });

    const data = todayPL();
    punkty.forEach(p => {
        appState.ksiazkaWydarzen.push({
            id: Date.now() + Math.random().toString(36).slice(2),
            data: data,
            godzinaStart: p.godzinaStart,
            godzinaPlanowana: p.godzinaPlanowana,
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


async function kopiujWpisKsiazki(index) {
    ensureKsiazkaState();
    const e = appState.ksiazkaWydarzen[index];
    if (!e) return;
    const text = e.tekst || "";
    try {
        await navigator.clipboard.writeText(text);
        if (typeof showToast === "function") showToast("✅ Skopiowano");
        else alert("Skopiowano");
    } catch (err) {
        alert("Nie udało się skopiować");
    }
}

window.kopiujWpisKsiazki = kopiujWpisKsiazki;

window.openPlanSluzbyModal = openPlanSluzbyModal;
window.closePlanSluzbyModal = closePlanSluzbyModal;
window.confirmPlanSluzby = confirmPlanSluzby;
