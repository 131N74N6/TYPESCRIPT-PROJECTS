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

let sessionCache: any = null;

async function getSession() {
    if (sessionCache) return sessionCache;
    
    const { data: { session } } = await supabase.auth.getSession();
    sessionCache = session;
    return session;
}

function onAuthStateChange(callback: (event: string, session: any | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        sessionCache = session;
        callback(event, session);
    });
    
    return () => subscription.unsubscribe();
}


async function signOut() {
    sessionCache = null;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export { getSession, onAuthStateChange, supabase, signOut };