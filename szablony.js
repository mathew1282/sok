// =====================================
// SZABLONY WPISÓW
// =====================================

function initSzablony() {
    renderSzablony();
}

function renderSzablony() {
    const container = document.getElementById("szablonyContainer");
    if (!container) return;

    let html = `
    <div class="card">
        <h2>Szablony wpisów</h2>
        <br>
        <button class="btn-success" onclick="openTemplateModal()">Dodaj szablon</button>
        <br><br>
        <table>
            <thead>
                <tr>
                    <th>Nazwa</th>
                    <th>Treść</th>
                    <th>Edytuj</th>
                    <th>Usuń</th>
                </tr>
            </thead>
            <tbody>
    `;

    appState.szablony.forEach((template, index) => {
        html += `
        <tr>
            <td>${template.nazwa}</td>
            <td style="white-space: pre-wrap; max-width: 600px;">${template.tresc}</td>
            <td>
                <button class="btn-primary" onclick="editTemplate(${index})">Edytuj</button>
            </td>
            <td>
                <button class="btn-danger" onclick="removeTemplate(${index})">Usuń</button>
            </td>
        </tr>`;
    });

    html += `
            </tbody>
        </table>
    </div>

    <!-- MODAL -->
    <div id="templateModal" class="modal-overlay" style="display:none;">
        <div class="modal">
            <h2>Szablon</h2>
            <label>Nazwa szablonu</label>
            <input type="text" id="templateName">

            <br><br>
            <label>Treść szablonu</label>
            <textarea id="templateText" rows="14" style="width:100%; font-family: monospace;"></textarea>

            <br><br>
            <h3>Dostępne znaczniki</h3>
            <div class="tag-buttons">
                <button type="button" class="btn-primary" onclick="insertTag('@patrol')">@patrol</button>
                <button type="button" class="btn-primary" onclick="insertTag('@dowodca')">@dowodca</button>
                <button type="button" class="btn-primary" onclick="insertTag('@kierowca')">@kierowca</button>
                <button type="button" class="btn-primary" onclick="insertTag('@sklad')">@sklad</button>
                <button type="button" class="btn-primary" onclick="insertTag('@wszyscy')">@wszyscy</button>
                <button type="button" class="btn-primary" onclick="insertTag('@zgloszenia')">@zgloszenia</button>
                <button type="button" class="btn-primary" onclick="insertTag('@polecenia')">@polecenia</button>
                <button type="button" class="btn-primary" onclick="insertTag('@KZ')">@KZ</button>
                <button type="button" class="btn-primary" onclick="insertTag('@MKK')">@MKK</button>
                <button type="button" class="btn-primary" onclick="insertTag('@data')">@data</button>
                <button type="button" class="btn-primary" onclick="insertTag('@godzina')">@godzina</button>
            </div>

            <div class="modal-actions">
                <button class="btn-success" onclick="saveTemplate()">Zapisz szablon</button>
                <button class="btn-danger" onclick="closeTemplateModal()">Anuluj</button>
            </div>
        </div>
    </div>
    `;

    container.innerHTML = html;
}

// =====================================
// MODAL + FUNKCJE
// =====================================

let currentTemplateEdit = null;

function openTemplateModal() {
    currentTemplateEdit = null;
    document.getElementById("templateName").value = "";
    document.getElementById("templateText").value = "";
    document.getElementById("templateModal").style.display = "flex";
}

function closeTemplateModal() {
    document.getElementById("templateModal").style.display = "none";
}

async function saveTemplate() {
    const nazwa = document.getElementById("templateName").value.trim();
    const tresc = document.getElementById("templateText").value.trim();

    if (!nazwa) {
        alert("Podaj nazwę szablonu");
        return;
    }

    if (currentTemplateEdit === null) {
        appState.szablony.push({ nazwa, tresc });
    } else {
        appState.szablony[currentTemplateEdit] = { nazwa, tresc };
    }

    await saveState();
    closeTemplateModal();
    renderSzablony();
}

async function editTemplate(index) {
    currentTemplateEdit = index;
    const template = appState.szablony[index];

    document.getElementById("templateName").value = template.nazwa;
    document.getElementById("templateText").value = template.tresc;

    document.getElementById("templateModal").style.display = "flex";
}

async function removeTemplate(index) {
    if (!confirm("Usunąć szablon?")) return;

    appState.szablony.splice(index, 1);
    await saveState();
    renderSzablony();
}

function insertTag(tag) {
    const textarea = document.getElementById("templateText");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    textarea.value = text.substring(0, start) + tag + text.substring(end);
    textarea.focus();
    textarea.selectionStart = start + tag.length;
    textarea.selectionEnd = start + tag.length;
}

// =====================================
// EXPOSE
// =====================================
window.openTemplateModal = openTemplateModal;
window.closeTemplateModal = closeTemplateModal;
window.saveTemplate = saveTemplate;
window.editTemplate = editTemplate;
window.removeTemplate = removeTemplate;
window.insertTag = insertTag;
