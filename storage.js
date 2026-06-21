const defaultState = {
    dane: {
        columns: [
            "Imię",
            "Nazwisko",
            "Stopień",
            "Numer służbowy",
            "Telefon"
        ],
        rows: []
    },

    zgloszenia: {
        columns: ["Linia", "Opis"],
        rows: []
    },

    polecenia: {
        columns: ["Linia", "Opis"],
        rows: []
    },

    patrole: [],
    szablony: [],

    // Pola zapamiętywane na stałe
    kz: "",
    mkk: ""
};

let appState = JSON.parse(localStorage.getItem("sokData")) || defaultState;

function saveState() {
    localStorage.setItem("sokData", JSON.stringify(appState));
}