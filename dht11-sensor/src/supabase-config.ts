import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_PROJECT;
const supabaseApiKey = import.meta.env.VITE_SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseApiKey) {
    throw new Error('Supabase environment variables not set!')
}

const supabase = createClient(supabaseUrl, supabaseApiKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        }
    }
});

export default supabase;