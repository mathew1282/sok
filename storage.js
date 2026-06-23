// ======================
// SUPABASE CONFIG
// ======================
const SUPABASE_URL = 'https://ytitgnljigizsunidwdy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aXRnbmxqaWdpenN1bmlkd2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjc5MTMsImV4cCI6MjA5Nzc0MzkxM30.rs3aHmDiDyAhjpIxbSsD4JLyv4tQMMOIcm8R2uZnM6M';

let supabaseClient = null;

// Inicjalizacja Supabase
function initSupabase() {
    if (supabaseClient) return supabaseClient;
    
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
}

// ======================
// GŁÓWNE FUNKCJE
// ======================

// Zapisz stan aplikacji
async function saveState() {
    const client = initSupabase();
    
    try {
        const { error } = await client
            .from('app_state')
            .upsert({
                id: 1,                    // pojedynczy rekord
                name: 'main_state',
                data: appState,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) throw error;
        console.log("✅ Dane zapisane na serwerze");
    } catch (err) {
        console.error("Błąd zapisu:", err);
        // fallback na localStorage
        localStorage.setItem("sokData", JSON.stringify(appState));
    }
}

// Wczytaj stan z serwera
async function loadState() {
    const client = initSupabase();
    
    try {
        const { data, error } = await client
            .from('app_state')
            .select('data')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        if (data?.data) {
            appState = { ...defaultState, ...data.data };
            console.log("✅ Dane wczytane z Supabase");
        } else {
            appState = { ...defaultState };
        }
    } catch (err) {
        console.warn("Nie udało się wczytać z serwera, używam localStorage");
        const saved = localStorage.getItem("sokData");
        if (saved) appState = { ...defaultState, ...JSON.parse(saved) };
    }
    
    saveState(); // synchronizacja
    return appState;
}

// ======================
// UPLOAD PDF
// ======================

async function uploadPDF(file, filename = null) {
    const client = initSupabase();
    if (!file) return null;

    const fileName = filename || `wpis_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.pdf`;

    try {
        const { data, error } = await client.storage
            .from('pdfy')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = client.storage
            .from('pdfy')
            .getPublicUrl(fileName);

        console.log("✅ PDF zapisany:", publicUrl);
        return publicUrl;
    } catch (err) {
        console.error("Błąd uploadu PDF:", err);
        alert("Nie udało się zapisać PDF na serwerze.");
        return null;
    }
}

// ======================
// INICJALIZACJA
// ======================

// Nadpisujemy stare funkcje
window.saveState = saveState;
window.loadState = loadState;
window.uploadPDF = uploadPDF;

// Automatyczne wczytanie przy starcie
document.addEventListener("DOMContentLoaded", async () => {
    await loadState();
});
