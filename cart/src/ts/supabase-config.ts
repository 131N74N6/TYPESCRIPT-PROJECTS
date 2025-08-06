import { createClient } from "@supabase/supabase-js";

const anonKey = import.meta.env.VITE_SUPABASE_API_KEY;
const projectUrl = import.meta.env.VITE_SUPABASE_URL_PROJECT;

const supabase = createClient(projectUrl, anonKey, {
    auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

let sessionCache: any = null;

async function getSession(): Promise<any> {
    if (sessionCache) return sessionCache;

    const { data: { session } } = await supabase.auth.getSession();
    sessionCache = session;
    return session;
}

function onAuthStateChange(callback: (event: string, session: any | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        sessionCache = session;
        callback(event, session);

    });

    return () => subscription.unsubscribe();
}

async function signOut(): Promise<void> {
    sessionCache = null;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export { getSession, onAuthStateChange, signOut, supabase };