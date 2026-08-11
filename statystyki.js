// =====================================
// STATYSTYKI
// =====================================

function ensureStatystykiState() {
    if (!appState.statystyki) {
        appState.statystyki = { interwencje: [], sprawdzenia: [] };
    }
    if (!Array.isArray(appState.statystyki.interwencje)) appState.statystyki.interwencje = [];
    if (!Array.isArray(appState.statystyki.sprawdzenia)) appState.statystyki.sprawdzenia = [];
}

function todayPL() {
    return new Date().toLocaleDateString("pl-PL");
}

function nowHHMM() {
    return new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

/** Wywołuj przy wstawianiu uwagi */
async function logInterwencja(typ) {
    ensureStatystykiState();
    const t = String(typ || "Inne").trim() || "Inne";
    appState.statystyki.interwencje.push({
        data: todayPL(),
        typ: t,
        godzina: nowHHMM()
    });
    await saveState();
}

/** Wywołuj po zatwierdzeniu godzin dla polecenia */
async function logSprawdzenie(payload) {
    ensureStatystykiState();
    appState.statystyki.sprawdzenia.push({
        data: todayPL(),
        rodzaj: payload.rodzaj || "",
        nazwa: payload.nazwa || "",
        linia: payload.linia || "",
        kmOd: payload.kmOd || "",
        kmDo: payload.kmDo || "",
        godzOd: payload.godzOd || "",
        godzDo: payload.godzDo || ""
    });
    await saveState();
}

function filterToday(arr) {
    const d = todayPL();
    return (arr || []).filter(x => x.data === d);
}

function initStatystyki() {
    ensureStatystykiState();
    renderStatystyki();
}

function renderStatystyki() {
    const container = document.getElementById("statystykiContainer");
    if (!container) return;
    ensureStatystykiState();

    const interwencje = filterToday(appState.statystyki.interwencje);
    const sprawdzenia = filterToday(appState.statystyki.sprawdzenia);

    const counts = { MKK: 0, Pouczony: 0, Legitymowany: 0, Inne: 0 };
    interwencje.forEach(i => {
        const t = i.typ || "Inne";
        if (counts[t] !== undefined) counts[t]++;
        else counts.Inne++;
    });

    const szlaki = sprawdzenia.filter(s => s.rodzaj === "Szlak");
    const towarowe = sprawdzenia.filter(s => s.rodzaj === "Stacja towarowa");
    const osobowe = sprawdzenia.filter(s => s.rodzaj === "Stacja osobowa");

    let html = `
    <div class="card">
        <h2>Statystyki – ${escapeHtml(todayPL())}</h2>
        <p style="color:#94a3b8; font-size:14px;">Dane z dzisiejszego dnia. Możesz skopiować tabele do Excela.</p>
        <br>

        <h3>Interwencje (z Uwag)</h3>
        <table>
            <thead><tr><th>Typ</th><th>Ilość</th></tr></thead>
            <tbody>
                <tr><td>MKK</td><td>${counts.MKK}</td></tr>
                <tr><td>Pouczony</td><td>${counts.Pouczony}</td></tr>
                <tr><td>Legitymowany</td><td>${counts.Legitymowany}</td></tr>
                <tr><td>Inne</td><td>${counts.Inne}</td></tr>
            </tbody>
        </table>
        <br>
        <button class="btn-primary" onclick="copyInterwencje()">Kopiuj interwencje do Excela</button>
        <br><br>

        <h3>Sprawdzenia szlaków (${szlaki.length})</h3>
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Nazwa szlaku</th>
                    <th>Godz. rozpoczęcia</th>
                    <th>Godz. zakończenia</th>
                    <th>Km początkowy</th>
                    <th>Km końcowy</th>
                    <th>Nr linii</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
    `;

    if (szlaki.length === 0) {
        html += `<tr><td colspan="8" style="text-align:center;color:#94a3b8;">Brak</td></tr>`;
    } else {
        szlaki.forEach((s, i) => {
            const globalIdx = appState.statystyki.sprawdzenia.indexOf(s);
            html += `<tr>
                <td>${escapeHtml(s.data)}</td>
                <td>${escapeHtml(s.nazwa)}</td>
                <td>${escapeHtml(s.godzOd)}</td>
                <td>${escapeHtml(s.godzDo)}</td>
                <td>${escapeHtml(s.kmOd)}</td>
                <td>${escapeHtml(s.kmDo)}</td>
                <td>${escapeHtml(s.linia)}</td>
                <td><button class="btn-danger" onclick="removeSprawdzenie(${globalIdx})">Usuń</button></td>
            </tr>`;
        });
    }

    html += `
            </tbody>
        </table>
        <br>
        <button class="btn-primary" onclick="copySzlaki()">Kopiuj szlaki do Excela</button>
        <br><br>

        <h3>Stacje towarowe (${towarowe.length})</h3>
        <p>${towarowe.length ? towarowe.map(s => escapeHtml(s.nazwa || "?")).join(", ") : "<span style='color:#94a3b8'>Brak</span>"}</p>
        <button class="btn-primary" onclick="copyStacje('Stacja towarowa')">Kopiuj towarowe do Excela</button>
        <br><br>

        <h3>Stacje osobowe (${osobowe.length})</h3>
        <p>${osobowe.length ? osobowe.map(s => escapeHtml(s.nazwa || "?")).join(", ") : "<span style='color:#94a3b8'>Brak</span>"}</p>
        <button class="btn-primary" onclick="copyStacje('Stacja osobowa')">Kopiuj osobowe do Excela</button>
    </div>
    `;

    container.innerHTML = html;
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (typeof showToast === "function") showToast("✅ Skopiowano do schowka");
        else alert("Skopiowano");
    }).catch(() => alert("Nie udało się skopiować"));
}

function copyInterwencje() {
    ensureStatystykiState();
    const interwencje = filterToday(appState.statystyki.interwencje);
    const counts = { MKK: 0, Pouczony: 0, Legitymowany: 0, Inne: 0 };
    interwencje.forEach(i => {
        const t = i.typ || "Inne";
        if (counts[t] !== undefined) counts[t]++;
        else counts.Inne++;
    });
    const lines = [
        `Data\t${todayPL()}`,
        `MKK\t${counts.MKK}`,
        `Pouczony\t${counts.Pouczony}`,
        `Legitymowany\t${counts.Legitymowany}`,
        `Inne\t${counts.Inne}`
    ];
    copyText(lines.join("\n"));
}

function copySzlaki() {
    ensureStatystykiState();
    const szlaki = filterToday(appState.statystyki.sprawdzenia).filter(s => s.rodzaj === "Szlak");
    const header = "Data\tNazwa szlaku\tGodz. rozpoczęcia\tGodz. zakończenia\tKm początkowy\tKm końcowy\tNr linii";
    const rows = szlaki.map(s =>
        [s.data, s.nazwa, s.godzOd, s.godzDo, s.kmOd, s.kmDo, s.linia].join("\t")
    );
    copyText([header, ...rows].join("\n"));
}

function copyStacje(rodzaj) {
    ensureStatystykiState();
    const list = filterToday(appState.statystyki.sprawdzenia).filter(s => s.rodzaj === rodzaj);
    const header = "Data\tNazwa\tGodz. rozpoczęcia\tGodz. zakończenia\tNr linii";
    const rows = list.map(s =>
        [s.data, s.nazwa, s.godzOd, s.godzDo, s.linia].join("\t")
    );
    copyText([header, `Ilość\t${list.length}`, ...rows].join("\n"));
}

async function removeSprawdzenie(index) {
    ensureStatystykiState();
    if (!confirm("Usunąć ten wpis ze statystyk?")) return;
    appState.statystyki.sprawdzenia.splice(index, 1);
    await saveState();
    renderStatystyki();
}

window.initStatystyki = initStatystyki;
window.logInterwencja = logInterwencja;
window.logSprawdzenie = logSprawdzenie;
window.copyInterwencje = copyInterwencje;
window.copySzlaki = copySzlaki;
window.copyStacje = copyStacje;
window.removeSprawdzenie = removeSprawdzenie;
