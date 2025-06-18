import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_PROJECT;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

export default supabase;