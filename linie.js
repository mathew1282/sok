function initLinie() {
    renderLinie();
}

function renderLinie() {
    const container = document.getElementById("linieContainer");
    if (!container) return;

    const today = new Date().toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Zbieramy WSZYSTKICH ludzi ze wszystkich patroli
    const allPeople = getAllPatrolMembers();

    let html = `
    <div class="card">
        <h2>🚉 Linie kolejowe</h2>
        
        <!-- Górna tabelka - numery linii -->
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
                    <td style="padding:14px; font-weight:600;">Szlak główny</td>
                    <td style="padding:14px;">
                        <input type="text" value="${appState.linie?.szlak || ''}" 
                               onchange="saveLine('szlak', this.value)" 
                               placeholder="np. 274"
                               style="width:100%; padding:10px; font-size:16px; color:black;">
                    </td>
                </tr>
                <tr style="background:#166534; color:white;">
                    <td style="padding:14px; font-weight:600;">Osobowa</td>
                    <td style="padding:14px;">
                        <input type="text" value="${appState.linie?.osobowa || ''}" 
                               onchange="saveLine('osobowa', this.value)" 
                               placeholder="np. 275"
                               style="width:100%; padding:10px; font-size:16px; color:black;">
                    </td>
                </tr>
                <tr style="background:#854d0e; color:white;">
                    <td style="padding:14px; font-weight:600;">Towarowa</td>
                    <td style="padding:14px;">
                        <input type="text" value="${appState.linie?.towarowa || ''}" 
                               onchange="saveLine('towarowa', this.value)" 
                               placeholder="np. 276"
                               style="width:100%; padding:10px; font-size:16px; color:black;">
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Tabele dla każdego funkcjonariusza -->
        <h3>Tabele do Excela – wszyscy z patroli</h3>
    `;

    if (allPeople.length === 0) {
        html += `<p style="color:#f87171;">Nie znaleziono patroli. Utwórz patrole w zakładce "Patrole".</p>`;
    } else {
        allPeople.forEach(person => {
            html += createPersonTable(person, today);
        });
    }

    html += `</div>`;
    container.innerHTML = html;
}

// ==============================================
// POBIERANIE WSZYSTKICH LUDZI Z PATROLI
// ==============================================
function getAllPatrolMembers() {
    const people = new Map(); // Mapa żeby uniknąć duplikatów

    if (!appState.patrole || appState.patrole.length === 0) return [];

    appState.patrole.forEach(patrol => {
        // Skład patrolu
        if (patrol.sklad && Array.isArray(patrol.sklad)) {
            patrol.sklad.forEach(name => {
                if (name) people.set(name.trim(), { fullName: name.trim(), nrPLK: getNrPLK(name.trim()) });
            });
        }
        // Dowódca i kierowca (na wszelki wypadek)
        if (patrol.dowodca) {
            const name = patrol.dowodca.trim();
            people.set(name, { fullName: name, nrPLK: getNrPLK(name) });
        }
        if (patrol.kierowca) {
            const name = patrol.kierowca.trim();
            people.set(name, { fullName: name, nrPLK: getNrPLK(name) });
        }
    });

    return Array.from(people.values());
}

// Szukanie Nr PLK po imieniu i nazwisku
function getNrPLK(fullName) {
    if (!appState.dane || !appState.dane.rows) return "";

    for (let row of appState.dane.rows) {
        const personName = `${row["Stopień"] || ""} ${row["Nazwisko"] || ""} ${row["Imię"] || ""}`.trim();
        if (personName === fullName || 
            `${row["Nazwisko"] || ""} ${row["Imię"] || ""}`.trim() === fullName) {
            return row["Numer służbowy"] || row["NrPLK"] || row["Nr PLK"] || "";
        }
    }
    return "";
}

// Tworzenie jednej tabeli dla osoby (tylko 3 wiersze + 4 kolumny)
function createPersonTable(person, today) {
    return `
    <div style="margin-bottom:25px;">
        <strong>${person.fullName}</strong>
        <table class="excelSubTable" style="width:100%; border-collapse:collapse; border:2px solid #64748b;">
            <tbody>
                <!-- Szlak -->
                <tr style="background:#1e40af22;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center; width:15%;">${person.nrPLK}</td>
                    <td style="padding:12px; border:1px solid #475569;">${appState.linie?.szlak || ''}</td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center; width:15%;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
                <!-- Osobowa -->
                <tr style="background:#16653422;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center;">${person.nrPLK}</td>
                    <td style="padding:12px; border:1px solid #475569;">${appState.linie?.osobowa || ''}</td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
                <!-- Towarowa -->
                <tr style="background:#854d0e22;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center;">${person.nrPLK}</td>
                    <td style="padding:12px; border:1px solid #475569;">${appState.linie?.towarowa || ''}</td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
            </tbody>
        </table>
    </div>`;
}

// =====================================
// ZAPIS
// =====================================
function saveLine(type, value) {
    if (!appState.linie) appState.linie = {};
    appState.linie[type] = value.trim();
    saveState();
    renderLinie(); // odświeża wszystkie tabele
}

// =====================================
// KOPIOWANIE – tylko 3 wiersze x 4 kolumny
// =====================================
function copyExcelTable() {
    // Kopiujemy wszystkie tabele (bez nagłówków osób)
    const tables = document.querySelectorAll('.excelSubTable');
    if (tables.length === 0) return;

    let combinedText = "";

    tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = [];
            cells.forEach(cell => {
                rowData.push(cell.innerText.trim());
            });
            combinedText += rowData.join("\t") + "\n";
        });
        combinedText += "\n"; // separator między osobami
    });

    navigator.clipboard.writeText(combinedText.trim()).then(() => {
        alert("✅ Skopiowano wszystkie tabele do Excela!\n\nWklej (Ctrl + V)");
    }).catch(() => {
        alert("Nie udało się skopiować. Spróbuj zaznaczyć ręcznie.");
    });
}

// Expose
window.saveLine = saveLine;
window.copyExcelTable = copyExcelTable;
