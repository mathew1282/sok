// =====================================
// ZGŁOSZENIA
// =====================================

function renderZgloszeniaLines() {
    const container = document.getElementById("zgloszeniaLinie");
    if (!container) return;

    const search = (document.getElementById("zglSearch")?.value || "").toLowerCase().trim();
    const allRows = appState.zgloszenia?.rows || [];

    let lines = [...new Set(
        allRows
            .filter(row => {
                if (!search) return true;
                const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.Opis || ""}`.toLowerCase();
                return t.includes(search);
            })
            .map(r => r.Linia)
            .filter(Boolean)
    )];
    lines = sortLinesNatural(lines);

    let html = "";
    lines.forEach(line => {
        const hasSelected = allRows.some((row, idx) =>
            row.Linia === line && selectedZgloszeniaIndexes.includes(idx)
        );
        let className = "line-pill";
        if (selectedZgloszeniaLine === line) className += " active";
        if (hasSelected) className += " has-selected";

        html += `<div class="${className}" onclick="selectZgloszeniaLine('${escapeAttr(line)}')">${escapeHtml(line)}</div>`;
    });

    container.innerHTML = html || "<p>Brak zgłoszeń</p>";

    // gdy jest szukanie albo wybrana linia → pokaż kafelki
    if (search || selectedZgloszeniaLine) {
        renderZgloszeniaItems();
    } else {
        const items = document.getElementById("zgloszeniaItems");
        if (items) items.innerHTML = "";
    }
}

function selectZgloszeniaLine(line) {
    if (selectedZgloszeniaLine === line) {
        selectedZgloszeniaLine = null;
    } else {
        selectedZgloszeniaLine = line;
    }
    renderZgloszeniaLines();
}

function renderZgloszeniaItems() {
    const container = document.getElementById("zgloszeniaItems");
    if (!container) return;

    const search = (document.getElementById("zglSearch")?.value || "").toLowerCase().trim();
    const allRows = appState.zgloszenia?.rows || [];

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));

    // jeśli wybrana linia → filtruj po niej
    if (selectedZgloszeniaLine) {
        rows = rows.filter(row => row.Linia === selectedZgloszeniaLine);
    }

    // autofilt tekstowy
    if (search) {
        rows = rows.filter(row => {
            const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.Opis || ""}`.toLowerCase();
            return t.includes(search);
        });
    }

    // bez szukania i bez wybranej linii → nic nie pokazuj
    if (!search && !selectedZgloszeniaLine) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    rows.forEach(row => {
        const isSelected = selectedZgloszeniaIndexes.includes(row._index);
        const label = (row.OpisKrotki || row.Opis || "(bez opisu)").substring(0, 120);
        html += `
        <div class="item-card ${isSelected ? "selected" : ""}" onclick="toggleZgloszenie(${row._index})">
            ${escapeHtml(label)}
        </div>`;
    });

    container.innerHTML = html || "<p>Brak wyników</p>";
}

function toggleZgloszenie(index) {
    const pos = selectedZgloszeniaIndexes.indexOf(index);
    if (pos > -1) selectedZgloszeniaIndexes.splice(pos, 1);
    else selectedZgloszeniaIndexes.push(index);

    renderZgloszeniaLines();
    updateLiveEntry();
}

// =====================================
// POLECENIA
// =====================================

function renderPoleceniaLines() {
    const container = document.getElementById("poleceniaLinie");
    if (!container) return;

    const search = (document.getElementById("polSearch")?.value || "").toLowerCase().trim();
    const allRows = appState.polecenia?.rows || [];

    let lines = [...new Set(
        allRows
            .filter(row => {
                if (!search) return true;
                const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.Opis || ""}`.toLowerCase();
                return t.includes(search);
            })
            .map(r => r.Linia)
            .filter(Boolean)
    )];
    lines = sortLinesNatural(lines);

    let html = "";
    lines.forEach(line => {
        const hasSelected = allRows.some((row, idx) =>
            row.Linia === line && selectedPoleceniaIndexes.includes(idx)
        );
        let className = "line-pill";
        if (selectedPoleceniaLine === line) className += " active";
        if (hasSelected) className += " has-selected";

        html += `<div class="${className}" onclick="selectPoleceniaLine('${escapeAttr(line)}')">${escapeHtml(line)}</div>`;
    });

    container.innerHTML = html || "<p>Brak poleceń</p>";

    if (search || selectedPoleceniaLine) {
        renderPoleceniaItems();
    } else {
        const items = document.getElementById("poleceniaItems");
        if (items) items.innerHTML = "";
    }
}

function selectPoleceniaLine(line) {
    if (selectedPoleceniaLine === line) {
        selectedPoleceniaLine = null;
    } else {
        selectedPoleceniaLine = line;
    }
    renderPoleceniaLines();
}

function renderPoleceniaItems() {
    const container = document.getElementById("poleceniaItems");
    if (!container) return;

    const search = (document.getElementById("polSearch")?.value || "").toLowerCase().trim();
    const allRows = appState.polecenia?.rows || [];

    let rows = allRows.map((row, index) => ({ ...row, _index: index }));

    if (selectedPoleceniaLine) {
        rows = rows.filter(row => row.Linia === selectedPoleceniaLine);
    }

    if (search) {
        rows = rows.filter(row => {
            const t = `${row.Linia || ""} ${row.OpisKrotki || ""} ${row.Opis || ""}`.toLowerCase();
            return t.includes(search);
        });
    }

    if (!search && !selectedPoleceniaLine) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    rows.forEach(row => {
        const isSelected = selectedPoleceniaIndexes.includes(row._index);
        const label = (row.OpisKrotki || row.Opis || "(bez opisu)").substring(0, 120);
        html += `
        <div class="item-card ${isSelected ? "selected" : ""}" onclick="togglePolecenie(${row._index})">
            ${escapeHtml(label)}
        </div>`;
    });

    container.innerHTML = html || "<p>Brak wyników</p>";
}

function togglePolecenie(index) {
    const pos = selectedPoleceniaIndexes.indexOf(index);
    if (pos > -1) selectedPoleceniaIndexes.splice(pos, 1);
    else selectedPoleceniaIndexes.push(index);

    renderPoleceniaLines();
    updateLiveEntry();
}

function filterGeneratorTiles() {
    renderZgloszeniaLines();
    renderPoleceniaLines();
}
