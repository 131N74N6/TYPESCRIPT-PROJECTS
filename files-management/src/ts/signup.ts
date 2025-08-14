import type { User } from "./custom-types";
import { supabase } from "./supabase-config";
import TableStorage from "./supabase-table";

const tableStorage = TableStorage<User>()

const signUpForm = document.querySelector('#sign-up-field') as HTMLFormElement;
const username = document.querySelector('#username') as HTMLInputElement;
const email = document.getElementById('email') as HTMLInputElement;
const password = document.getElementById('password') as HTMLInputElement;
const signUpMessage = document.getElementById('message') as HTMLDivElement;
let timeout: null | number = null;

function SignUp() {
    function initSignUp(): void {
        signUpForm.addEventListener("submit", async (event) => await insertNewUser(event)); 
    }

    async function insertNewUser(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedEmail = email.value.trim();
        const trimmedUserName = username.value.trim();
        const trimmedPassword = password.value.trim();

        try {
            const { error } = await supabase.auth.signUp({
                email: trimmedEmail,
                password: trimmedPassword,
                options: {
                    data: {
                        username: trimmedUserName
                    },
                    emailRedirectTo: 'http://localhost:5173/html/signin.html'
                } 
            });
            
            if (error) throw 'Sign up failed';
            signUpMessage.classList.remove('hidden');
            signUpMessage.classList.add('block');
            signUpMessage.textContent = 'Sign up successful! Check your email for verification.';
        } catch (error: any) {
            signUpMessage.classList.remove('hidden');
            signUpMessage.classList.add('block');
            signUpMessage.textContent = error;
        } finally {
            showSignUpMessage();
            signUpForm.reset();
        }
    }

    function showSignUpMessage(): void {
        timeout = window.setTimeout(() => teardownSignUpMessage(), 3000);
    }

    function teardownSignUpMessage(): void {
        signUpMessage.classList.remove('block');
        signUpMessage.classList.add('hidden');

        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }
    }

    function teardownSignUp(): void {
        signUpForm.removeEventListener("submit", async (event) => await insertNewUser(event)); 
        signUpForm.reset();
        tableStorage.teardownStorage();
        teardownSignUpMessage();
    }

    return { initSignUp, teardownSignUp }
}

const signUp = SignUp();
const init = () => signUp.initSignUp();
const teradown = () => signUp.teardownSignUp();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teradown);