function initKsiazka() {
    const container = document.getElementById("ksiazkaContainer");
    if (!container) return;

    // Wstrzyknięcie stylów starego systemu (tylko dla tej zakładki)
    if (!document.getElementById("old-ksiazka-styles")) {
        const style = document.createElement("style");
        style.id = "old-ksiazka-styles";
        style.textContent = `
/* ===== STYL STAREGO SYSTEMU – tylko wewnątrz .old-ksiazka ===== */
.old-ksiazka {
    --old-blue: #003366;
    --old-blue-hover: #004080;
    font-family: 'Segoe UI', sans-serif;
    color: #000;
    background: linear-gradient(135deg, #eaeef3, #f5f7fa);
    min-height: 100%;
    display: flex;
    flex-direction: column;
    margin: -25px; /* niweluje padding #content */
    border-radius: 0;
}

.old-ksiazka * {
    box-sizing: border-box;
}

/* Górna belka */
.old-ksiazka .top-bar {
    background-color: var(--old-blue);
    color: #fff;
    padding: 1rem 2rem;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
}

.old-ksiazka .top-bar-content {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.old-ksiazka .top-bar h1 {
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    flex-grow: 1;
    margin: 0;
    color: #fff;
}

.old-ksiazka .logo {
    height: 60px;
    position: absolute;
    left: 0;
}

/* Główna zawartość */
.old-ksiazka .main-container {
    display: flex;
    flex-grow: 1;
    min-height: 0;
    margin: 1rem 1rem 1rem 0.5rem;
    gap: 1rem;
}

/* Menu boczne */
.old-ksiazka .sidebar {
    background-color: var(--old-blue);
    color: #fff;
    width: 240px;
    min-width: 240px;
    padding: 1rem;
    border-radius: 12px;
    height: fit-content;
}

.old-ksiazka .user-info {
    background: rgba(255,255,255,0.1);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 1.2rem;
    font-size: 0.9rem;
    line-height: 1.4;
}

.old-ksiazka .user-info strong {
    display: block;
    font-size: 1rem;
    margin-bottom: 4px;
}

.old-ksiazka .menu {
    list-style: none;
    padding: 0;
    margin: 0;
}

.old-ksiazka .menu > li {
    margin-bottom: 0.4rem;
}

.old-ksiazka .menu a {
    color: #fff;
    text-decoration: none;
    display: block;
    padding: 0.55rem 0.7rem;
    border-radius: 8px;
    transition: background-color 0.3s ease;
    font-size: 0.95rem;
}

.old-ksiazka .menu a:hover,
.old-ksiazka .menu a.active {
    background-color: var(--old-blue-hover);
}

.old-ksiazka .has-submenu .submenu {
    display: none;
    list-style: none;
    margin-top: 0.3rem;
    padding-left: 1rem;
}

.old-ksiazka .has-submenu.open .submenu {
    display: block;
}

.old-ksiazka .submenu a {
    font-size: 0.88rem;
    padding: 0.4rem 0.6rem;
    opacity: 0.9;
}

/* Główna treść */
.old-ksiazka .content {
    flex-grow: 1;
    padding: 1.5rem;
    background-color: #fff;
    color: #000;
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.05);
    min-height: 100%;
    overflow: auto;
}

/* Formularz */
.old-ksiazka .formularz {
    background: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 25px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
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
    border: 1px solid #ccc;
    border-radius: 4px;
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
    gap: 20px;
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
    border-radius: 5px;
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

.old-ksiazka .btn-green {
    background: #16a34a;
}
.old-ksiazka .btn-green:hover {
    background: #15803d;
}

.old-ksiazka .btn-red {
    background: #dc2626;
}
.old-ksiazka .btn-red:hover {
    background: #b91c1c;
}

.old-ksiazka .btn-blue {
    background: #2563eb;
}

/* Tabele */
.old-ksiazka .tabela-wpisow {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
    font-size: 0.85rem;
}

.old-ksiazka .tabela-wpisow th,
.old-ksiazka .tabela-wpisow td {
    border: 1px solid #ccc;
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
}

.old-ksiazka .tabela-wpisow th {
    background-color: #f0f0f0;
    font-weight: 700;
    text-align: center;
}

.old-ksiazka .tabela-wpisow td:first-child {
    white-space: nowrap;
    text-align: center;
    width: 90px;
}

.old-ksiazka .report-header {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 20px;
}

.old-ksiazka .report-header h2 {
    margin: 0 0 8px 0;
    font-size: 1.25rem;
    color: #003366;
}

.old-ksiazka .report-meta {
    font-size: 0.9rem;
    color: #334155;
    line-height: 1.5;
}

.old-ksiazka .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #003366;
    margin: 22px 0 10px 0;
    padding-bottom: 4px;
    border-bottom: 2px solid #003366;
}

.old-ksiazka .actions-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 18px 0;
}

/* Stopka */
.old-ksiazka .footer {
    background-color: var(--old-blue);
    color: #fff;
    text-align: center;
    padding: 0.9rem;
    font-size: 0.85rem;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    margin: 1rem 1rem 0 0.5rem;
}

/* Responsywność */
@media (max-width: 900px) {
    .old-ksiazka .main-container {
        flex-direction: column;
    }
    .old-ksiazka .sidebar {
        width: 100%;
    }
}
`;
        document.head.appendChild(style);
    }

    // HTML starego wyglądu
    container.innerHTML = `
<div class="old-ksiazka">
    <!-- Górna belka -->
    <div class="top-bar">
        <div class="top-bar-content">
            <h1>Portal SOK</h1>
        </div>
    </div>

    <div class="main-container">
        <!-- LEWE MENU (jak w starym systemie) -->
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
                <li><a href="#">Rozpocznij Raport / Kontynuuj – STANOWISKO 1</a></li>
                <li><a href="#">Lista Raportów</a></li>
                <li class="has-submenu open">
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
            <div class="report-header">
                <h2>Raport Nr 453/2026</h2>
                <div class="report-meta">
                    <strong>IOKP14/1.2720.1.2026.453</strong><br>
                    Służba: <strong>dzienna 2026-08-15</strong><br>
                    Służba przyjęta od: <strong>Bartosz Wołoch</strong>
                </div>
            </div>

            <!-- Formularz dodawania wpisu -->
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

            <!-- Patrole -->
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

            <!-- Wpisy z raportu -->
            <div class="section-title">Wpisy w książce wydarzeń</div>
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
                        <td>Do służby zgłosili się ww. funkcjonariusze SOK: Starszy Strażnik Mastalerz Mateusz, Strażnik Horbal Maciej. Przed rozpoczęciem odprawy rozpytano o stan psychofizyczny, samopoczucie, a także zdolność do pełnienia służby, również z bronią palną. Uwagi: bez uwag. Następnie po otwarciu magazynu uzbrojenia sprawdzono czy funkcjonariusze posiadają przy sobie legitymacje osoby dopuszczonej do pracy z bronią. Wydano funkcjonariuszom broń palną, amunicję i ŚPB. Odnotowano wszystko w książce wydania i przyjęcia broni, amunicji i środków przymusu bezpośredniego. Po zakończeniu wydawania wyposażenia, zamknięto magazyn. Uwagi: bez uwag. Wydano dodatkowy inwentarz dokumentując to za podpisem w książce wydania dodatkowego inwentarza. Przeprowadzono odprawę...</td>
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

    <div class="footer">
        © KGSOK 2025 – Wszelkie prawa zastrzeżone
    </div>
</div>
`;

    // Proste otwieranie/zamykanie submenu (tylko wizualnie)
    container.querySelectorAll('.has-submenu > a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            link.parentElement.classList.toggle('open');
        });
    });
}
