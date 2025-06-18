import { createClient } from "@supabase/supabase-js";

const anonKey = import.meta.env.VITE_SUPABASE_API_KEY;
const projectUrl = import.meta.env.VITE_SUPABASE_URL_PROJECT;

const supabase = createClient(projectUrl, anonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

export default supabase;