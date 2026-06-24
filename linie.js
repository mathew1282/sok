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

    // Pobieranie danych osoby (pierwsza osoba z patroli lub z zakładki Dane)
    let personHeader = "Brak danych osoby";
    let nrPLK = "";

    if (appState.patrole && appState.patrole.length > 0) {
        const patrol = appState.patrole[0];
        const dowodca = patrol.dowodca || (patrol.sklad && patrol.sklad[0]) || "";
        personHeader = dowodca ? ` ${dowodca}` : "Brak danych osoby";
    } 
    else if (appState.dane && appState.dane.rows && appState.dane.rows.length > 0) {
        const osoba = appState.dane.rows[0];
        const stopien = osoba["Stopień"] || "";
        const nazwisko = osoba["Nazwisko"] || "";
        const imie = osoba["Imię"] || "";
        personHeader = `${stopien} ${nazwisko} ${imie}`.trim();
        nrPLK = osoba["Numer służbowy"] || osoba["Nr PLK"] || "";
    }

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
                        <input type="text" 
                               value="${appState.linie?.szlak || ''}" 
                               onchange="saveLine('szlak', this.value)"
                               placeholder="np. 274"
                               style="width:100%; padding:10px; font-size:16px; color:black;">
                    </td>
                </tr>
                <tr style="background:#166534; color:white;">
                    <td style="padding:14px; font-weight:600;">Osobowa</td>
                    <td style="padding:14px;">
                        <input type="text" 
                               value="${appState.linie?.osobowa || ''}" 
                               onchange="saveLine('osobowa', this.value)"
                               placeholder="np. 275"
                               style="width:100%; padding:10px; font-size:16px; color:black;">
                    </td>
                </tr>
                <tr style="background:#854d0e; color:white;">
                    <td style="padding:14px; font-weight:600;">Towarowa</td>
                    <td style="padding:14px;">
                        <input type="text" 
                               value="${appState.linie?.towarowa || ''}" 
                               onchange="saveLine('towarowa', this.value)"
                               placeholder="np. 276"
                               style="width:100%; padding:10px; font-size:16px; color:black;">
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Tabela do kopiowania do Excela -->
        <h3>Tabela do raportu / Excela</h3>
        <table id="excelTable" style="width:100%; border-collapse:collapse; border:2px solid #64748b; margin-bottom:15px;">
            <thead>
                <tr>
                    <th colspan="4" style="background:#1e2937; color:white; padding:16px; font-size:18px; text-align:center; border:1px solid #475569;">
                        ${personHeader}
                    </th>
                </tr>
                <tr style="background:#334155; color:white;">
                    <th style="padding:12px; border:1px solid #475569; width:15%;">Nr PLK</th>
                    <th style="padding:12px; border:1px solid #475569; width:20%;">Linia</th>
                    <th style="padding:12px; border:1px solid #475569; width:15%;">Data</th>
                    <th style="padding:12px; border:1px solid #475569;">Uwagi / Treść</th>
                </tr>
            </thead>
            <tbody>
                <!-- Szlak -->
                <tr style="background:#1e40af22;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center;">${nrPLK}</td>
                    <td style="padding:12px; border:1px solid #475569;">${appState.linie?.szlak || ''}</td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
                <!-- Osobowa -->
                <tr style="background:#16653422;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center;">${nrPLK}</td>
                    <td style="padding:12px; border:1px solid #475569;">${appState.linie?.osobowa || ''}</td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
                <!-- Towarowa -->
                <tr style="background:#854d0e22;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center;">${nrPLK}</td>
                    <td style="padding:12px; border:1px solid #475569;">${appState.linie?.towarowa || ''}</td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569;" contenteditable="true"></td>
                </tr>
            </tbody>
        </table>

        <button onclick="copyExcelTable()" class="btn-primary" style="padding:12px 24px; font-size:16px;">
            📋 Kopiuj tabelę do Excela
        </button>
    </div>
    `;

    container.innerHTML = html;
}

// =====================================
// ZAPIS NUMERÓW LINII
// =====================================
function saveLine(type, value) {
    if (!appState.linie) appState.linie = {};
    appState.linie[type] = value.trim();
    saveState();
    renderLinie();        // odświeża tabelę poniżej
}

// =====================================
// KOPIOWANIE DO EXCELA
// =====================================
function copyExcelTable() {
    const table = document.getElementById("excelTable");
    if (!table) return;

    const range = document.createRange();
    range.selectNode(table);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
        document.execCommand('copy');
        alert("✅ Tabela została skopiowana do schowka!\n\nWklej do Excela (Ctrl + V)");
    } catch (err) {
        alert("Nie udało się skopiować automatycznie.\nZaznacz tabelę ręcznie i naciśnij Ctrl + C.");
    }
}

// Expose functions
window.saveLine = saveLine;
window.copyExcelTable = copyExcelTable;
