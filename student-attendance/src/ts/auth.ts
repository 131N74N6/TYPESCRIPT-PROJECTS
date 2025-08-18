import type { Profile } from './custom-types';
import { supabase } from './supabase-config';

export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

export async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error.message;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error.message;
}

export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
    
    if (error) throw error.message;
    return data;
}

export async function updateProfile(profile: Partial<Profile>) {
    const { error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('user_id', profile.user_id);
    
    if (error) throw error.message;
}