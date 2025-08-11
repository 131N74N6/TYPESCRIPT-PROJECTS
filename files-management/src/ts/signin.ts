import DataStorages from "./supabase-table";
import type { User } from "./custom-types";
import { supabase } from "./supabase-config";

const message = document.getElementById('message') as HTMLDivElement;
const email = document.getElementById('email') as HTMLInputElement;
const password = document.getElementById('password') as HTMLInputElement;
const signInField = document.getElementById('sign-in-field') as HTMLFormElement;
const tableStorage = DataStorages<User>('cart_user');
let timeout: number | null = null;

function SignIn() {
    function initSignIn() {
        signInField.onsubmit = async (event) => await veryfySignIn(event);
    }

    async function veryfySignIn(event: SubmitEvent) {
        event.preventDefault();
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
                } catch(error: any) {
                    message.classList.remove('hidden');
                    message.classList.add('flex');
                    message.innerHTML = '';
                    message.textContent = `Error: ${error.message || error}`;
                    setDisplayMessageDuration();
                }

                if (!userProfile) {
                    const username = user.user_metadata?.username || 'User';
                    try {
                        await tableStorage.upsertData({
                            id: user.id,
                            email: user.email,
                            username: username,
                            password: trimmedPasword
                        });
                    } catch (error: any) {
                        message.classList.remove('hidden');
                        message.classList.add('flex');
                        message.innerHTML = '';
                        message.textContent = `Error: ${error.message || error}`;
                        setDisplayMessageDuration();
                        return;
                    }
                }
            }
            window.location.href = '/html/home.html';
        } catch (error: any) {
            message.classList.remove('hidden');
            message.classList.add('flex');
            message.innerHTML = '';
            message.textContent = `Error: ${error.message || error}`;
            setDisplayMessageDuration();
        }
    }

    function setDisplayMessageDuration() {
        timeout = window.setTimeout(() => teardownMessage(), 3000);
    }

    function teardownMessage() {
        message.classList.remove('flex');
        message.classList.add('hidden');

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }

    function teardownSignIn() {
        signInField.reset();
        teardownMessage();
    }

    return { initSignIn, teardownSignIn }
}

const signIn = SignIn();
document.addEventListener('DOMContentLoaded', signIn.initSignIn);
window.addEventListener('beforeunload', signIn.teardownSignIn);