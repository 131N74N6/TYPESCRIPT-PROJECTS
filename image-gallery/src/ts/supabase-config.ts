import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_PROJECT;
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error("Mismatch");

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

export default supabase;