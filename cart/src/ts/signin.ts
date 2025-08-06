import type { Users } from "./custom-types";
import { supabase } from "./supabase-config";
import TableStorage from "./supabase-table";

const tableStorage = TableStorage<Users>('cart_user');
const signInForm = document.getElementById('sign-in-form') as HTMLFormElement;
const signInMessage = document.getElementById('signin-message') as HTMLDivElement;
const email = document.getElementById('email') as HTMLInputElement;
const password = document.getElementById('password') as HTMLInputElement;
const controller = new AbortController();
let timeout: number | null = null;

function initEventListeners() {
    signInForm.addEventListener('submit', async (event) => verifySavedUser(event), {
        signal: controller.signal
    });
} 

async function verifySavedUser(event: SubmitEvent): Promise<void> {
    try {
        event.preventDefault();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.value.trim(),
            password: password.value.trim()
        });

        if (error) throw error;
        const user = data.user;

        if (user) {
            let userProfile: Users | null = null;
            try {
                const { data, error } = await supabase
                .from('cart_user')
                .select('*')
                .eq('id', user.id)
                .single();

                if (error && error.code !== 'PGRST116') throw error;
                userProfile = data;
            } catch (error: any) {
                console.log(`Error when checking existing user: ${error.message}`);
            }
            if (!userProfile) {
                const username = user.user_metadata?.username || 'new user';
                try {
                    await tableStorage.upsertData({
                        id: user.id,
                        email: user.email,
                        username: username,
                        password: password.value.trim()
                    });
                } catch (error: any) {
                    signInMessage.classList.remove('hidden');
                    signInMessage.classList.add('block');
                    signInMessage.textContent = `Login successful, but failed to save profile: ${error.message}`;
                    showSignInMessage();
                    return;
                }
            }
        }
    } catch (error: any) {
        signInMessage.classList.remove('hidden');
        signInMessage.classList.add('block');
        signInMessage.textContent = error.message;
    }
}

function showSignInMessage(): void {
    timeout = window.setTimeout(() => teardownSignInMessage(), 3000);
}

function teardownSignInMessage(): void {
    signInMessage.classList.remove('block');
    signInMessage.classList.add('hidden');

    if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
    }
}

function teardownSignIn(): void {
    controller.abort();
    signInForm.reset();
    teardownSignInMessage();
    tableStorage.teardownStorage();
}

document.addEventListener('DOMContentLoaded', initEventListeners);
window.addEventListener('beforeunload', teardownSignIn)