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

        <h3>Tabele do Excela – wszyscy z patroli</h3>
        <button onclick="copyAllTables()" class="btn-primary" style="padding:12px 24px; font-size:16px; margin-bottom:20px;">
            📋 Kopiuj WSZYSTKIE tabele do Excela
        </button>
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
    const people = new Map();

    if (!appState.patrole || appState.patrole.length === 0) return [];

    appState.patrole.forEach(patrol => {
        if (patrol.sklad && Array.isArray(patrol.sklad)) {
            patrol.sklad.forEach(name => {
                if (name) {
                    const trimmed = name.trim();
                    people.set(trimmed, { 
                        fullName: trimmed, 
                        nrPLK: getNrPLK(trimmed) 
                    });
                }
            });
        }
        if (patrol.dowodca) {
            const trimmed = patrol.dowodca.trim();
            people.set(trimmed, { fullName: trimmed, nrPLK: getNrPLK(trimmed) });
        }
    });

    return Array.from(people.values());
}

function getNrPLK(fullName) {
    if (!appState.dane || !appState.dane.rows) return "";

    for (let row of appState.dane.rows) {
        const rowName = `${row["Stopień"] || ""} ${row["Nazwisko"] || ""} ${row["Imię"] || ""}`.trim();
        if (rowName === fullName || 
            `${row["Nazwisko"] || ""} ${row["Imię"] || ""}`.trim() === fullName) {
            return row["Nr PLK"] || "";   // ← dokładnie taka nazwa jak podałeś
        }
    }
    return "";
}

// ==============================================
// TWORZENIE TABELI DLA JEDNEJ OSOBY
// ==============================================
function createPersonTable(person, today) {
    return `
    <div style="margin-bottom:30px;">
        <!-- Scalony wiersz z nazwiskiem i imieniem -->
        <div style="background: #FFFF00; color:white; padding:14px 18px; font-size:18px; font-weight:bold; border-radius:6px 6px 0 0;">
            ${person.fullName}
        </div>
        
        <table class="excelSubTable" style="width:100%; border-collapse:collapse; border:2px solid #475569;">
            <tbody>
                <!-- Szlak -->
                <tr style="background:#1e40af; color:white;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center; width:15%;">${person.nrPLK}</td>
                    <td style="padding:12px; border:1px solid #475569; color:white;">${appState.linie?.szlak || ''}</td>
                    <td style="padding:12px; border:0px solid #475569;"></td>          <!-- pusta kolumna 1 -->
                    <td style="padding:12px; border:1px solid #475569; text-align:center; width:15%;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
                <!-- Osobowa -->
                <tr style="background:#166534; color:white;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center;">${person.nrPLK}</td>
                    <td style="padding:12px; border:1px solid #475569; color:white;">${appState.linie?.osobowa || ''}</td>
                    <td style="padding:12px; border:0px solid #475569;"></td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center;">${today}</td>
                    
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
                <!-- Towarowa -->
                <tr style="background:#854d0e; color:white;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center;">${person.nrPLK}</td>
                    <td style="padding:12px; border:1px solid #475569; color:white;">${appState.linie?.towarowa || ''}</td>
                    <td style="padding:12px; border:0px solid #475569;"></td>
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
    renderLinie();
}

// =====================================
// KOPIOWANIE WSZYSTKICH TABEL
// =====================================
function copyAllTables() {
    const tables = document.querySelectorAll('.excelSubTable');
    if (tables.length === 0) {
        alert("Brak tabel do skopiowania.");
        return;
    }

    let combinedText = "";

    tables.forEach((table, index) => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => cell.innerText.trim());
            combinedText += rowData.join("\t") + "\n";
        });
        if (index < tables.length - 1) {
            combinedText += "\n"; // odstęp między osobami
        }
    });

    navigator.clipboard.writeText(combinedText.trim()).then(() => {
        alert(`✅ Skopiowano ${tables.length} tabel do Excela!\n\nWklej (Ctrl + V)`);
    }).catch(() => {
        alert("Nie udało się skopiować automatycznie. Zaznacz tabele ręcznie i Ctrl+C.");
    });
}

// Expose
window.saveLine = saveLine;
window.copyAllTables = copyAllTables;
