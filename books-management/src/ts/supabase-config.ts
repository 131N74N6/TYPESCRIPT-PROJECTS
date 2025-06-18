import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_PROJECT;
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;

if (!supabaseKey || !supabaseUrl) throw new Error("mismatch URL or KEY");

const supabase = createClient(supabaseUrl, supabaseKey, {
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