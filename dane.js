// =====================================
// DANE FUNKCJONARIUSZY
// =====================================

function initDane() {
    const container = document.getElementById("daneContainer");
    if (!container) return;
    renderDane();
}

// =====================================
// RENDER
// =====================================

function renderDane() {
    const container = document.getElementById("daneContainer");
    if (!container) return;

    const columns = appState.dane.columns;
    const rows = appState.dane.rows;

    let html = `
    <div class="card">
        <h2>Dane funkcjonariuszy</h2>
        <br>
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
            <button class="btn-success" onclick="addDaneColumn()">Dodaj kolumnę</button>
            <button class="btn-primary" onclick="addDaneRow()">Dodaj funkcjonariusza</button>
            <button class="btn-export" onclick="exportDaneExcel()">📥 Eksport Excel</button>
            <button class="btn-import" onclick="document.getElementById('daneExcelLoader').click()">📤 Import Excel</button>
            <input type="file" id="daneExcelLoader" accept=".xlsx,.xls,.csv" hidden onchange="importDaneExcel(event)">
        </div>
        <br><br>
        <table>
            <thead>
                <tr>
    `;

    columns.forEach((column, index) => {
        html += `
            <th>
                ${column}
                <br><br>
                <button class="btn-primary" onclick="renameDaneColumn(${index})">Zmień</button>
                <button class="btn-danger" onclick="removeDaneColumn(${index})">Usuń</button>
            </th>
        `;
    });

    html += `
            <th>Akcje</th>
        </tr>
    </thead>
    <tbody>
    `;

    rows.forEach((row, rowIndex) => {
        html += `<tr>`;
        columns.forEach(column => {
            html += `
            <td>
                <input type="text" value="${row[column] || ''}" 
                       onchange="updateDaneCell(${rowIndex}, '${column}', this.value)">
            </td>`;
        });
        html += `
            <td>
                <button class="btn-danger" onclick="removeDaneRow(${rowIndex})">Usuń</button>
            </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// =====================================
// FUNKCJE Z ZAPISEM NA SERWERZE
// =====================================

async function addDaneColumn() {
    const columnName = prompt("Podaj nazwę kolumny");
    if (!columnName) return;

    appState.dane.columns.push(columnName);
    appState.dane.rows.forEach(row => row[columnName] = "");

    await saveState();
    renderDane();
}

async function renameDaneColumn(index) {
    const oldName = appState.dane.columns[index];
    const newName = prompt("Nowa nazwa kolumny", oldName);
    if (!newName) return;

    appState.dane.columns[index] = newName;
    appState.dane.rows.forEach(row => {
        row[newName] = row[oldName];
        delete row[oldName];
    });

    await saveState();
    renderDane();
}

async function removeDaneColumn(index) {
    const columnName = appState.dane.columns[index];
    if (!confirm(`Usunąć kolumnę "${columnName}"?`)) return;

    appState.dane.columns.splice(index, 1);
    appState.dane.rows.forEach(row => delete row[columnName]);

    await saveState();
    renderDane();
}

async function addDaneRow() {
    const newRow = {};
    appState.dane.columns.forEach(col => newRow[col] = "");
    appState.dane.rows.push(newRow);

    await saveState();
    renderDane();
}

async function removeDaneRow(index) {
    if (!confirm("Usunąć funkcjonariusza?")) return;
    appState.dane.rows.splice(index, 1);
    await saveState();
    renderDane();
}

async function updateDaneCell(rowIndex, columnName, value) {
    appState.dane.rows[rowIndex][columnName] = value;
    await saveState();
}

// =====================================
// EXCEL – eksport / import
// =====================================

function ensureXlsxLibDane() {
    if (typeof XLSX !== "undefined") return true;
    alert("Brak biblioteki Excel (SheetJS). Dodaj w index.html:\n<script src=\"https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js\"></script>");
    return false;
}

function exportDaneExcel() {
    if (!ensureXlsxLibDane()) return;

    const columns = appState.dane?.columns || [];
    const rows = appState.dane?.rows || [];

    if (!rows.length) {
        alert("Brak danych do eksportu");
        return;
    }

    const data = rows.map(r => {
        const o = {};
        columns.forEach(col => {
            o[col] = r[col] != null ? String(r[col]) : "";
        });
        return o;
    });

    const ws = XLSX.utils.json_to_sheet(data, { header: columns });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dane");
    XLSX.writeFile(wb, "dane_funkcjonariuszy.xlsx");
}

async function importDaneExcel(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (!ensureXlsxLibDane()) return;

    try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!json.length) {
            alert("Plik Excel jest pusty");
            return;
        }

        // Pobierz nagłówki z pierwszego wiersza (klucze obiektów)
        const excelColumns = Object.keys(json[0]);

        const mapped = json.map(row => {
            const o = {};
            excelColumns.forEach(col => {
                o[col] = row[col] != null ? String(row[col]).trim() : "";
            });
            return o;
        }).filter(r => Object.values(r).some(v => v !== ""));

        if (!mapped.length) {
            alert("Nie znaleziono poprawnych wierszy");
            return;
        }

        const mode = confirm(
            `Znaleziono ${mapped.length} wierszy.\n\nOK = ZASTĄP wszystkie dane\nAnuluj = DODAJ do istniejących`
        );

        if (!appState.dane) {
            appState.dane = { columns: [], rows: [] };
        }

        if (mode) {
            // Zastąp – weź kolumny z Excela
            appState.dane.columns = excelColumns.slice();
            appState.dane.rows = mapped;
        } else {
            // Dodaj – zachowaj istniejące kolumny + dodaj nowe z Excela
            excelColumns.forEach(col => {
                if (!appState.dane.columns.includes(col)) {
                    appState.dane.columns.push(col);
                    appState.dane.rows.forEach(r => r[col] = "");
                }
            });
            // Uzupełnij brakujące kolumny w nowych wierszach
            mapped.forEach(row => {
                appState.dane.columns.forEach(col => {
                    if (row[col] === undefined) row[col] = "";
                });
            });
            if (!Array.isArray(appState.dane.rows)) appState.dane.rows = [];
            appState.dane.rows.push(...mapped);
        }

        await saveState();
        renderDane();
        alert(`Zaimportowano ${mapped.length} wierszy`);
    } catch (err) {
        console.error(err);
        alert("Błąd importu Excel: " + (err.message || err));
    }
}

// =====================================
// EXPOSE
// =====================================
window.addDaneColumn = addDaneColumn;
window.renameDaneColumn = renameDaneColumn;
window.removeDaneColumn = removeDaneColumn;
window.addDaneRow = addDaneRow;
window.removeDaneRow = removeDaneRow;
window.updateDaneCell = updateDaneCell;
window.exportDaneExcel = exportDaneExcel;
window.importDaneExcel = importDaneExcel;
