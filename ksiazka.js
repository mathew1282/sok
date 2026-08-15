function initKsiazka() {
    const container = document.getElementById("ksiazkaContainer");
    if (!container) return;

    // ===== UKRYCIE GŁÓWNEGO PASKA NAWIGACJI + TOPBAR =====
    const mainSidebar = document.querySelector(".app > .sidebar");
    const mainContent = document.querySelector(".main-content");
    const topbar = document.querySelector(".topbar");
    const contentSection = document.getElementById("content");

    if (mainSidebar && !mainSidebar.dataset.originalDisplay) {
        mainSidebar.dataset.originalDisplay = mainSidebar.style.display || "";
    }
    if (topbar && !topbar.dataset.originalDisplay) {
        topbar.dataset.originalDisplay = topbar.style.display || "";
    }

    // Ukryj główny pasek i topbar
    if (mainSidebar) mainSidebar.style.display = "none";
    if (topbar) topbar.style.display = "none";

    // Rozszerz treść na całą szerokość i wysokość
    if (mainContent) {
        mainContent.style.marginLeft = "0";
        mainContent.style.width = "100%";
    }
    if (contentSection) {
        contentSection.style.padding = "0";
        contentSection.style.height = "100%";
        contentSection.style.overflow = "hidden";
    }

    // ===== STYL STAREGO SYSTEMU + HOVER ZONE =====
    if (!document.getElementById("old-ksiazka-styles")) {
        const style = document.createElement("style");
        style.id = "old-ksiazka-styles";
        style.textContent = `
/* ===== HOVER ZONE – lewa krawędź ekranu ===== */
.ksiazka-hover-zone {
    position: fixed;
    top: 0;
    left: 0;
    width: 18px;
    height: 100vh;
    z-index: 9998;
    background: transparent;
}

/* Gdy najedziemy na strefę – pokazujemy oryginalny pasek */
.ksiazka-hover-zone:hover ~ .app > .sidebar,
.app > .sidebar.ksiazka-force-show {
    display: flex !important;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 9999;
    box-shadow: 4px 0 20px rgba(0,0,0,0.4);
    animation: slideInSidebar 0.2s ease;
}

@keyframes slideInSidebar {
    from { transform: translateX(-100%); }
    to   { transform: translateX(0); }
}

/* ===== STYL STAREGO SYSTEMU ===== */
.old-ksiazka {
    --old-blue: #003366;
    --old-blue-hover: #004080;
    font-family: 'Segoe UI', sans-serif;
    color: #000;
    background: #eaeef3;
    height: 100vh;
    display: flex;
    flex-direction: column;
    margin: 0;
    overflow: hidden;
}

.old-ksiazka * {
    box-sizing: border-box;
}

/* Górna belka */
.old-ksiazka .top-bar {
    background-color: var(--old-blue);
    color: #fff;
    padding: 0.9rem 2rem;
    flex-shrink: 0;
}

.old-ksiazka .top-bar-content {
    display: flex;
    align-items: center;
    justify-content: center;
}

.old-ksiazka .top-bar h1 {
    font-size: 1.4rem;
    font-weight: bold;
    text-align: center;
    margin: 0;
    color: #fff;
}

/* Główna zawartość */
.old-ksiazka .main-container {
    display: flex;
    flex: 1;
    min-height: 0;
    margin: 0;
    gap: 0;
    overflow: hidden;
}

/* Menu boczne – pełna wysokość, cały niebieski */
.old-ksiazka .sidebar {
    background-color: var(--old-blue);
    color: #fff;
    width: 240px;
    min-width: 240px;
    padding: 1.2rem 1rem;
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 0;
    overflow-y: auto;
}

.old-ksiazka .user-info {
    background: rgba(255,255,255,0.12);
    padding: 14px;
    border-radius: 8px;
    margin-bottom: 1.4rem;
    font-size: 0.9rem;
    line-height: 1.45;
}

.old-ksiazka .user-info strong {
    display: block;
    font-size: 1.05rem;
    margin-bottom: 4px;
}

.old-ksiazka .menu {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
}

.old-ksiazka .menu > li {
    margin-bottom: 0.35rem;
}

.old-ksiazka .menu a {
    color: #fff;
    text-decoration: none;
    display: block;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    transition: background-color 0.25s ease;
    font-size: 0.95rem;
}

.old-ksiazka .menu a:hover,
.old-ksiazka .menu a.active {
    background-color: var(--old-blue-hover);
}

.old-ksiazka .has-submenu .submenu {
    display: none;
    list-style: none;
    margin-top: 0.25rem;
    padding-left: 0.9rem;
}

.old-ksiazka .has-submenu.open .submenu {
    display: block;
}

.old-ksiazka .submenu a {
    font-size: 0.87rem;
    padding: 0.4rem 0.6rem;
    opacity: 0.9;
}

/* Główna treść */
.old-ksiazka .content {
    flex: 1;
    padding: 1.4rem 1.6rem;
    background-color: #f5f7fa;
    color: #000;
    overflow-y: auto;
    min-height: 0;
}

/* Formularz */
.old-ksiazka .formularz {
    background: #fff;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.07);
    border: 1px solid #e2e8f0;
}

.old-ksiazka .form-group {
    margin-bottom: 14px;
}

.old-ksiazka label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    font-size: 0.95rem;
    color: #1e293b;
}

.old-ksiazka input[type="time"],
.old-ksiazka input[type="date"],
.old-ksiazka input[type="text"],
.old-ksiazka select,
.old-ksiazka textarea {
    width: 100%;
    max-width: 420px;
    padding: 8px 10px;
    font-size: 0.95rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #fff;
    color: #000;
}

.old-ksiazka input[type="time"] {
    width: auto;
    min-width: 9ch;
}

.old-ksiazka textarea {
    min-height: 90px;
    resize: vertical;
}

.old-ksiazka .checkbox-row {
    display: flex;
    gap: 22px;
    margin: 12px 0;
    align-items: center;
}

.old-ksiazka .checkbox-row label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    margin: 0;
    cursor: pointer;
}

.old-ksiazka button,
.old-ksiazka .btn {
    background-color: #007acc;
    color: white;
    border: none;
    padding: 9px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    margin-right: 8px;
    margin-top: 6px;
}

.old-ksiazka button:hover,
.old-ksiazka .btn:hover {
    background-color: #005e99;
}

.old-ksiazka .btn-green { background: #16a34a; }
.old-ksiazka .btn-green:hover { background: #15803d; }

.old-ksiazka .btn-red { background: #dc2626; }
.old-ksiazka .btn-red:hover { background: #b91c1c; }

.old-ksiazka .btn-blue { background: #2563eb; }
.old-ksiazka .btn-blue:hover { background: #1d4ed8; }

/* Tabele */
.old-ksiazka .tabela-wpisow {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    font-size: 0.85rem;
    background: #fff;
}

.old-ksiazka .tabela-wpisow th,
.old-ksiazka .tabela-wpisow td {
    border: 1px solid #cbd5e1;
    padding: 9px 11px;
    text-align: left;
    vertical-align: top;
    color: #000;
    background: #fff;
}

.old-ksiazka .tabela-wpisow th {
    background-color: #f1f5f9;
    font-weight: 700;
    text-align: center;
    color: #1e293b;
}

.old-ksiazka .tabela-wpisow td:first-child {
    white-space: nowrap;
    text-align: center;
    width: 90px;
}

/* Nagłówek raportu – szare tło */
.old-ksiazka .report-header {
    background: #e2e8f0;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 20px;
}

.old-ksiazka .report-header h2 {
    margin: 0 0 8px 0;
    font-size: 1.25rem;
    color: #003366;
}

.old-ksiazka .report-meta {
    font-size: 0.92rem;
    color: #334155;
    line-height: 1.55;
}

/* Sekcje */
.old-ksiazka .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #003366;
    margin: 0 0 12px 0;
    padding-bottom: 5px;
    border-bottom: 2px solid #003366;
}

.old-ksiazka .section-box {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.old-ksiazka .actions-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 16px 0 8px 0;
}

/* Responsywność */
@media (max-width: 900px) {
    .old-ksiazka .main-container {
        flex-direction: column;
    }
    .old-ksiazka .sidebar {
        width: 100%;
        height: auto;
        max-height: 280px;
    }
}
`;
        document.head.appendChild(style);
    }

    // ===== HOVER ZONE (lewa krawędź) =====
    const oldZone = document.querySelector(".ksiazka-hover-zone");
    if (oldZone) oldZone.remove();

    const hoverZone = document.createElement("div");
    hoverZone.className = "ksiazka-hover-zone";
    document.body.insertBefore(hoverZone, document.body.firstChild);

    let hideTimeout = null;

    function showMainSidebar() {
        if (mainSidebar) {
            mainSidebar.classList.add("ksiazka-force-show");
            clearTimeout(hideTimeout);
        }
    }

    function hideMainSidebar() {
        hideTimeout = setTimeout(() => {
            if (mainSidebar) {
                mainSidebar.classList.remove("ksiazka-force-show");
            }
        }, 280);
    }

    hoverZone.addEventListener("mouseenter", showMainSidebar);
    hoverZone.addEventListener("mouseleave", hideMainSidebar);

    if (mainSidebar) {
        mainSidebar.addEventListener("mouseenter", showMainSidebar);
        mainSidebar.addEventListener("mouseleave", hideMainSidebar);
    }

    // ===== HTML – NOWA KOLEJNOŚĆ SEKCJI =====
    container.innerHTML = `
<div class="old-ksiazka">
    <!-- Górna belka -->
    <div class="top-bar">
        <div class="top-bar-content">
            <h1>Portal SOK</h1>
        </div>
    </div>

    <div class="main-container">
        <!-- LEWE MENU – pełna wysokość, tylko wybrane pozycje -->
        <aside class="sidebar">
            <div class="user-info">
                <strong>Witaj</strong>
                Mateusz Dąbrowski<br>
                (PLK068970)<br>
                Rola: Użytkownik IOKP
            </div>

            <ul class="menu">
                <li><a href="#">Strona główna</a></li>
                <li><a href="#" class="active">Książka Wydarzeń</a></li>
                <li class="has-submenu">
                    <a href="#">Słowniki ▾</a>
                    <ul class="submenu">
                        <li><a href="#">Numer linii</a></li>
                        <li><a href="#">EKW – Patrol scenariusz</a></li>
                        <li><a href="#">EKW – Szablon wpisu do raportu</a></li>
                    </ul>
                </li>
                <li><a href="#">Wyloguj</a></li>
            </ul>
        </aside>

        <!-- GŁÓWNA TREŚĆ -->
        <div class="content">

            <!-- 1. Formularz dodawania wpisu -->
            <div class="formularz">
                <h3 style="margin:0 0 16px 0; color:#003366;">Dodaj wpis do książki wydarzeń</h3>

                <div class="form-group">
                    <label>Data (dzisiejsza):</label>
                    <input type="date" value="2026-08-15" readonly>
                </div>

                <div class="form-group">
                    <label>Godzina wydarzenia:</label>
                    <input type="time" value="14:30">
                </div>

                <div class="form-group">
                    <label>Wybierz szablon wpisu:</label>
                    <select>
                        <option value="">-- wybierz szablon --</option>
                        <option>Dyżurny ruchu nastawni dysponującej stacji Legnica zgłosił</option>
                        <option>Dyżurny ruchu z LCS Bolesławiec zgłosił, że</option>
                        <option>Kom. zm. IOK Wrocław zgłosił, że</option>
                        <option>Patrol w składzie</option>
                        <option>Przekazanie wyników do kom.zm. w IOK Wrocław</option>
                        <option>Zgłoszenie patrolu nr</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Opis:</label>
                    <textarea placeholder="Wpisz opis zdarzenia..."></textarea>
                </div>

                <div class="checkbox-row">
                    <label><input type="checkbox"> Ważne</label>
                    <label><input type="checkbox"> Trwa nadal</label>
                </div>

                <div>
                    <button class="btn-green">Dodaj wpis</button>
                    <button class="btn-blue">Dodaj wpis bez wymaganych danych</button>
                </div>
            </div>

            <!-- 2. Nagłówek raportu (szare tło) -->
            <div class="report-header">
                <h2>Raport Nr 453/2026</h2>
                <div class="report-meta">
                    <strong>IOKP14/1.2720.1.2026.453</strong><br>
                    Służba: <strong>dzienna 2026-08-15</strong><br>
                    Służba przyjęta od: <strong>Bartosz Wołoch</strong>
                </div>
            </div>

            <!-- 3. Odprawa -->
            <div class="section-box">
                <div class="section-title">Odprawa</div>
                <p style="margin:0; color:#334155; font-size:0.95rem; line-height:1.5;">
                    Tutaj będzie treść odprawy (obecnie puste – gotowe na dane).
                </p>
            </div>

            <!-- 4. Patrole -->
            <div class="section-box">
                <div class="section-title">Patrole – Służba dyżurna IOKP</div>
                <table class="tabela-wpisow">
                    <thead>
                        <tr>
                            <th>Lp.</th>
                            <th>Rodzaj</th>
                            <th>Miejsce</th>
                            <th>Linia</th>
                            <th>Scenariusz patrolu</th>
                            <th>Inne działania</th>
                            <th>Skład</th>
                            <th>Pojazdy</th>
                            <th>Akcja</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>zmotoryzowany</td>
                            <td>szlak</td>
                            <td>275</td>
                            <td>Inne</td>
                            <td>Działania Horyzont</td>
                            <td>Starszy Strażnik Mastalerz Mateusz, Szeregowy Karejwo Alexander, Aspirant Kopcin Tomasz. Na dowódcę wyznaczono: Starszy Strażnik Mastalerz Mateusz.</td>
                            <td>KIA B853</td>
                            <td>
                                <button class="btn-blue" style="padding:4px 10px;font-size:0.8rem;">Edytuj</button>
                                <button class="btn-red" style="padding:4px 10px;font-size:0.8rem;">Usuń</button>
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>zmotoryzowany</td>
                            <td>szlak</td>
                            <td>275</td>
                            <td>Inne</td>
                            <td>Działania Horyzont</td>
                            <td>Strażnik Horbal Maciej, Szeregowy Pankiewicz Konrad. Na kierowcę wyznaczono: Strażnik Horbal Maciej.</td>
                            <td>14-50</td>
                            <td>
                                <button class="btn-blue" style="padding:4px 10px;font-size:0.8rem;">Edytuj</button>
                                <button class="btn-red" style="padding:4px 10px;font-size:0.8rem;">Usuń</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin-top:14px;">
                    <button class="btn-green">Dodaj patrol</button>
                </div>
            </div>

            <!-- 5. Wpisy raportu / opis wydarzenia (białe tło + czarna czcionka) -->
            <div class="section-box">
                <div class="section-title">Wpisy raportu / opis wydarzenia</div>
                <table class="tabela-wpisow">
                    <thead>
                        <tr>
                            <th>Godzina</th>
                            <th>Wpis raportu / opis zdarzenia</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>06:00:00</td>
                            <td>Służbę w dniu 2026-08-15 przyjęto od Bartosz Wołoch wraz z planem zabezpieczenia jednostki, stanem broni palnej, amunicji i ŚPB zgodnie z prowadzoną ewidencją, a także posiadanym w jednostce dodatkowym inwentarzem. Notatniki służbowe - 20 szt. Kasetka, kluczyk.</td>
                            <td><button class="btn-blue" style="padding:4px 10px;font-size:0.8rem;">Edytuj</button></td>
                        </tr>
                        <tr>
                            <td>07:00:00</td>
                            <td>Do służby zgłosili się ww. funkcjonariusze SOK: Starszy Strażnik Mastalerz Mateusz, Strażnik Horbal Maciej. Przed rozpoczęciem odprawy rozpytano o stan psychofizyczny, samopoczucie, a także zdolność do pełnienia służby, również z bronią palną. Uwagi: bez uwag.</td>
                            <td>
                                <button class="btn-blue" style="padding:4px 10px;font-size:0.8rem;">Edytuj</button>
                                <button class="btn-red" style="padding:4px 10px;font-size:0.8rem;">Usuń</button>
                            </td>
                        </tr>
                        <tr>
                            <td>07:30:00</td>
                            <td>Zgłoszono rozdysponowanie na służbę dzienną. Przyjął komendant zmiany Berliński Tomasz IOK Wrocław.</td>
                            <td>
                                <button class="btn-blue" style="padding:4px 10px;font-size:0.8rem;">Edytuj</button>
                                <button class="btn-red" style="padding:4px 10px;font-size:0.8rem;">Usuń</button>
                            </td>
                        </tr>
                        <tr>
                            <td>07:40:00</td>
                            <td>Po odprawie wyznaczono patrole w składzie: 1. Patrol nr 1: Starszy Strażnik Mastalerz Mateusz, Szeregowy Karejwo Alexander, Aspirant Kopcin Tomasz. Na dowódcę wyznaczono: Starszy Strażnik Mastalerz Mateusz, 2. Patrol nr 2: Strażnik Horbal Maciej, Szeregowy Pankiewicz Konrad. Na kierowcę wyznaczono: Strażnik Horbal Maciej.</td>
                            <td>
                                <button class="btn-blue" style="padding:4px 10px;font-size:0.8rem;">Edytuj</button>
                                <button class="btn-red" style="padding:4px 10px;font-size:0.8rem;">Usuń</button>
                            </td>
                        </tr>
                        <tr>
                            <td>08:00:00</td>
                            <td>Patrol nr 1 i patrol nr 2 udali się do wyznaczonych zadań.</td>
                            <td>
                                <button class="btn-blue" style="padding:4px 10px;font-size:0.8rem;">Edytuj</button>
                                <button class="btn-red" style="padding:4px 10px;font-size:0.8rem;">Usuń</button>
                            </td>
                        </tr>
                        <tr>
                            <td>10:00:00</td>
                            <td>Informowałem telefonicznie o bieżącej sytuacji w IOKP Legnica, bez uwag oraz o lokalizacji patroli potwierdzonej w CZK do IOK Wrocław. Przyjął komendant zmiany Berliński Tomasz IOK Wrocław.</td>
                            <td>
                                <button class="btn-blue" style="padding:4px 10px;font-size:0.8rem;">Edytuj</button>
                                <button class="btn-red" style="padding:4px 10px;font-size:0.8rem;">Usuń</button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="actions-bar">
                    <button class="btn-red">Zakończ raport</button>
                    <button class="btn-blue">Przekaż raport</button>
                </div>
            </div>

        </div>
    </div>
</div>
`;

    // Submenu
    container.querySelectorAll('.has-submenu > a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            link.parentElement.classList.toggle('open');
        });
    });
}

// Przywrócenie paska i topbara gdy użytkownik przełączy się na inną zakładkę
function restoreMainSidebar() {
    const mainSidebar = document.querySelector(".app > .sidebar");
    const mainContent = document.querySelector(".main-content");
    const topbar = document.querySelector(".topbar");
    const contentSection = document.getElementById("content");
    const hoverZone = document.querySelector(".ksiazka-hover-zone");

    if (mainSidebar) {
        mainSidebar.style.display = mainSidebar.dataset.originalDisplay || "";
        mainSidebar.classList.remove("ksiazka-force-show");
    }
    if (topbar) {
        topbar.style.display = topbar.dataset.originalDisplay || "";
    }
    if (mainContent) {
        mainContent.style.marginLeft = "";
        mainContent.style.width = "";
    }
    if (contentSection) {
        contentSection.style.padding = "";
        contentSection.style.height = "";
        contentSection.style.overflow = "";
    }
    if (hoverZone) {
        hoverZone.remove();
    }
}

// Podpięcie pod loadPage
(function () {
    const originalLoadPage = window.loadPage;
    if (typeof originalLoadPage === "function") {
        window.loadPage = function (page) {
            if (page !== "ksiazka") {
                restoreMainSidebar();
            }
            return originalLoadPage.apply(this, arguments);
        };
    }
})();
