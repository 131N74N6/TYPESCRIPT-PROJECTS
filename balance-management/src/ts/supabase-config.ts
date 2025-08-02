import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_PROJECT;
const supabaseApiKey = import.meta.env.VITE_SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseApiKey) {
    throw new Error('Supabase environment variables not set!')
}

const supabase = createClient(supabaseUrl, supabaseApiKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        }
    }
});

async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

function onAuthStateChange(callback: (event: string, session: any | null) => void) {
    supabase.auth.onAuthStateChange(callback);
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
        throw error;
    }
}

export { getSession, onAuthStateChange, supabase, signOut };