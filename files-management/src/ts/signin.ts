import DataStorages from "./supabase-table";
import type { User } from "./custom-types";
import supabase from "./supabase-config";

const message = document.getElementById('message') as HTMLDivElement;
const email = document.getElementById('email') as HTMLInputElement;
const password = document.getElementById('password') as HTMLInputElement;
const signInField = document.getElementById('sign-in-field') as HTMLFormElement;
const tableStorage = DataStorages<User>('cart_user');

function SignIn() {
    function initSignIn() {}

    async function veryfySignIn(event: SubmitEvent) {
        event?.preventDefault();
        const trimmedEmail = email.value.trim();
        const trimmedPasword = password.value.trim();

        try {
            if (trimmedEmail === '' || trimmedPasword === '') throw 'Missing required data';

            const { data, error } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password: trimmedPasword,
            });

            if (error) throw 'Failed to sign in';
            
            const user = data.user;

            if (user) {
                let userProfile: User | null = null;
                try {
                    const { data, error } = await supabase
                    .from('cloud_user')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                    if (error && error.code !== 'PGRST116') throw error;

                    userProfile = data;
                } catch(error) {
                    
                }
            }

        } catch (error: any) {
            message.innerHTML = '';
            message.textContent = `Error: ${error.message || error}`;
        }
    }

    return {}
}