// ======================
// SUPABASE INTEGRACJA
// ======================
const SUPABASE_URL = 'https://ytitgnljigizsunidwdy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aXRnbmxqaWdpenN1bmlkd2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjc5MTMsImV4cCI6MjA5Nzc0MzkxM30.rs3aHmDiDyAhjpIxbSsD4JLyv4tQMMOIcm8R2uZnM6M';

let supabaseClient = null;

function getSupabase() {
    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

// ======================
// DEFAULT STATE
// ======================
const defaultState = {
    dane: {
        columns: [
            "Imię",
            "Nazwisko",
            "Stopień",
            "Numer służbowy",
            "NrPLK"
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
    kz: "",
    mkk: "",
    linie: {
        szlak: "",
        osobowa: "",
        towarowa: ""
    }  
};

let appState = { ...defaultState };

// ======================
// GŁÓWNE FUNKCJE
// ======================

async function saveState() {
    try {
        const client = getSupabase();
        const { error } = await client
            .from('app_state')
            .upsert({
                id: 1,
                name: 'main_state',
                data: appState,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        console.log("✅ Dane zapisane na serwerze");
    } catch (err) {
        console.error("❌ Błąd zapisu do Supabase:", err);
        alert("Nie udało się zapisać danych na serwerze!");
    }
}

async function loadState() {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('app_state')
            .select('data')
            .eq('id', 1)
            .single();

        if (data?.data) {
            appState = { ...defaultState, ...data.data };
            console.log("✅ Wczytano dane z Supabase");
        } else {
            console.warn("⚠️ Brak danych na serwerze - używam domyślnych");
            appState = { ...defaultState };
        }
    } catch (err) {
        console.error("❌ Błąd wczytywania z Supabase:", err);
        alert("Nie udało się wczytać danych z serwera. Sprawdź połączenie.");
        appState = { ...defaultState };
    }
}

// ======================
// INICJALIZACJA
// ======================
window.saveState = saveState;
window.loadState = loadState;

document.addEventListener("DOMContentLoaded", async () => {
    await loadState();
});
