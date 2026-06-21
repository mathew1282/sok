// =====================================
// POLECENIA
// =====================================

function initPolecenia() {
    renderPolecenia();
}

// =====================================
// RENDER
// =====================================

function renderPolecenia() {

    const container =
        document.getElementById(
            "poleceniaContainer"
        );

    if (!container) return;

    let html = `

    <div class="card">

        <h2>Polecenia</h2>

        <br>

        <button
            class="btn-success"
            onclick="addPolecenie()">

            Dodaj polecenie

        </button>

        <br><br>

        <table>

            <thead>

                <tr>

                    <th>Linia</th>

                    <th>Opis</th>

                    <th>Akcje</th>

                </tr>

            </thead>

            <tbody>
    `;

    appState.polecenia.rows.forEach(
        (row,index) => {

        html += `

        <tr>

            <td>

                <input
                    type="text"

                    value="${row.Linia || ''}"

                    onchange="
                    updatePolecenie(
                        ${index},
                        'Linia',
                        this.value
                    )">

            </td>

            <td>

                <input
                    type="text"

                    value="${row.Opis || ''}"

                    onchange="
                    updatePolecenie(
                        ${index},
                        'Opis',
                        this.value
                    )">

            </td>

            <td>

                <button
                    class="btn-danger"

                    onclick="
                    removePolecenie(
                        ${index}
                    )">

                    Usuń

                </button>

            </td>

        </tr>
        `;
    });

    html += `
            </tbody>

        </table>

    </div>
    `;

    container.innerHTML = html;
}

// =====================================
// DODAJ
// =====================================

function addPolecenie() {

    appState.polecenia.rows.push({

        Linia: "",
        Opis: ""

    });

    saveState();

    renderPolecenia();
}

// =====================================
// USUŃ
// =====================================

function removePolecenie(index) {

    if (
        !confirm(
            "Usunąć polecenie?"
        )
    ) {
        return;
    }

    appState.polecenia.rows.splice(
        index,
        1
    );

    saveState();

    renderPolecenia();
}

// =====================================
// EDYCJA
// =====================================

function updatePolecenie(
    index,
    field,
    value
) {

    appState
        .polecenia
        .rows[index][field] = value;

    saveState();
}