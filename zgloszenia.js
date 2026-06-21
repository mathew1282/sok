// =====================================
// ZGŁOSZENIA
// =====================================

function initZgloszenia() {
    renderZgloszenia();
}

// =====================================
// RENDER
// =====================================

function renderZgloszenia() {

    const container =
        document.getElementById(
            "zgloszeniaContainer"
        );

    if (!container) return;

    let html = `

    <div class="card">

        <h2>Zgłoszenia</h2>

        <br>

        <button
            class="btn-success"
            onclick="addZgloszenie()">

            Dodaj zgłoszenie

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

    appState.zgloszenia.rows.forEach(
        (row,index) => {

        html += `

        <tr>

            <td>

                <input
                    type="text"

                    value="${row.Linia || ''}"

                    onchange="
                    updateZgloszenie(
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
                    updateZgloszenie(
                        ${index},
                        'Opis',
                        this.value
                    )">

            </td>

            <td>

                <button
                    class="btn-danger"

                    onclick="
                    removeZgloszenie(
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

function addZgloszenie() {

    appState.zgloszenia.rows.push({

        Linia: "",
        Opis: ""

    });

    saveState();

    renderZgloszenia();
}

// =====================================
// USUŃ
// =====================================

function removeZgloszenie(index) {

    if (
        !confirm(
            "Usunąć zgłoszenie?"
        )
    ) {
        return;
    }

    appState.zgloszenia.rows.splice(
        index,
        1
    );

    saveState();

    renderZgloszenia();
}

// =====================================
// EDYCJA
// =====================================

function updateZgloszenie(
    index,
    field,
    value
) {

    appState
        .zgloszenia
        .rows[index][field] = value;

    saveState();
}