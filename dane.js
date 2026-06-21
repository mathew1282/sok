// =====================================
// DANE FUNKCJONARIUSZY
// =====================================

function initDane() {

    const container =
        document.getElementById("daneContainer");

    if (!container) return;

    renderDane();
}

// =====================================
// RENDER
// =====================================

function renderDane() {

    const container =
        document.getElementById("daneContainer");

    if (!container) return;

    const columns =
        appState.dane.columns;

    const rows =
        appState.dane.rows;

    let html = `

    <div class="card">

        <h2>Dane funkcjonariuszy</h2>

        <br>

        <button
            class="btn-success"
            onclick="addDaneColumn()">

            Dodaj kolumnę

        </button>

        <button
            class="btn-primary"
            onclick="addDaneRow()">

            Dodaj funkcjonariusza

        </button>

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

                <button
                    class="btn-primary"
                    onclick="renameDaneColumn(${index})">

                    Zmień

                </button>

                <button
                    class="btn-danger"
                    onclick="removeDaneColumn(${index})">

                    Usuń

                </button>

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

                <input
                    type="text"
                    value="${row[column] || ''}"

                    onchange="
                    updateDaneCell(
                    ${rowIndex},
                    '${column}',
                    this.value
                    )">

            </td>
            `;
        });

        html += `
            <td>

                <button
                    class="btn-danger"
                    onclick="removeDaneRow(${rowIndex})">

                    Usuń

                </button>

            </td>
        `;

        html += `</tr>`;
    });

    html += `
        </tbody>
        </table>

    </div>
    `;

    container.innerHTML = html;
}

// =====================================
// KOLUMNY
// =====================================

function addDaneColumn() {

    const columnName =
        prompt("Podaj nazwę kolumny");

    if (!columnName) return;

    appState.dane.columns.push(
        columnName
    );

    appState.dane.rows.forEach(row => {

        row[columnName] = "";
    });

    saveState();

    renderDane();
}

function renameDaneColumn(index) {

    const oldName =
        appState.dane.columns[index];

    const newName =
        prompt(
            "Nowa nazwa kolumny",
            oldName
        );

    if (!newName) return;

    appState.dane.columns[index] =
        newName;

    appState.dane.rows.forEach(row => {

        row[newName] =
            row[oldName];

        delete row[oldName];
    });

    saveState();

    renderDane();
}

function removeDaneColumn(index) {

    const columnName =
        appState.dane.columns[index];

    if (
        !confirm(
            `Usunąć kolumnę "${columnName}" ?`
        )
    ) {
        return;
    }

    appState.dane.columns.splice(
        index,
        1
    );

    appState.dane.rows.forEach(row => {

        delete row[columnName];
    });

    saveState();

    renderDane();
}

// =====================================
// WIERSZE
// =====================================

function addDaneRow() {

    const newRow = {};

    appState.dane.columns.forEach(col => {

        newRow[col] = "";
    });

    appState.dane.rows.push(
        newRow
    );

    saveState();

    renderDane();
}

function removeDaneRow(index) {

    if (
        !confirm(
            "Usunąć funkcjonariusza?"
        )
    ) {
        return;
    }

    appState.dane.rows.splice(
        index,
        1
    );

    saveState();

    renderDane();
}

// =====================================
// EDYCJA KOMÓRKI
// =====================================

function updateDaneCell(
    rowIndex,
    columnName,
    value
) {

    appState.dane.rows[rowIndex][columnName] =
        value;

    saveState();
}