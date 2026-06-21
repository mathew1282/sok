function initLinie() {
    renderLinie();
}

function renderLinie() {
    const container = document.getElementById("linieContainer");
    if (!container) return;

    let html = `
    <div class="card">
        <h2>Linie</h2>
        <br>
        <h3>Numery linii kolejowych</h3>
        <br>

        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr>
                    <th style="width:40%; text-align:left; padding:12px;">Opis</th>
                    <th style="text-align:left; padding:12px;">Numer linii</th>
                </tr>
            </thead>
            <tbody>
                <!-- Szlak -->
                <tr style="background:#1e40af; color:white;">
                    <td style="padding:14px; font-weight:600;">Szlak</td>
                    <td style="padding:14px;">
                        <input type="text" 
                               value="${appState.linie?.szlak || ''}" 
                               onchange="saveLine('szlak', this.value)"
                               style="width:100%; padding:10px; font-size:16px; color:black;">
                    </td>
                </tr>
                <!-- Osobowa -->
                <tr style="background:#166534; color:white;">
                    <td style="padding:14px; font-weight:600;">Osobowa</td>
                    <td style="padding:14px;">
                        <input type="text" 
                               value="${appState.linie?.osobowa || ''}" 
                               onchange="saveLine('osobowa', this.value)"
                               style="width:100%; padding:10px; font-size:16px; color:black;">
                    </td>
                </tr>
                <!-- Towarowa -->
                <tr style="background:#854d0e; color:white;">
                    <td style="padding:14px; font-weight:600;">Towarowa</td>
                    <td style="padding:14px;">
                        <input type="text" 
                               value="${appState.linie?.towarowa || ''}" 
                               onchange="saveLine('towarowa', this.value)"
                               style="width:100%; padding:10px; font-size:16px; color:black;">
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    `;

    container.innerHTML = html;
}

// =====================================
// ZAPIS
// =====================================

function saveLine(type, value) {
    if (!appState.linie) appState.linie = {};
    appState.linie[type] = value.trim();
    saveState();
}