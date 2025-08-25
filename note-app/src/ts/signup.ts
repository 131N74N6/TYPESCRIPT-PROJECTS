import type { Users } from "./custom-types";
import { supabase } from "./supabase-config";
import SupabaseTable from "./supabase-table";

class SignUp extends SupabaseTable<Users> {
    private controller = new AbortController();
    private signUpForm = document.querySelector('#sign-up-form') as HTMLFormElement;
    private username = document.querySelector('#username') as HTMLInputElement;
    private email = document.getElementById('email') as HTMLInputElement;
    private password = document.getElementById('password') as HTMLInputElement;
    private signUpMessage = document.getElementById('message') as HTMLDivElement;
    private timeout: null | number = null;

    constructor() {
        super();
    }
    
    initSignUp(): void {
        this.signUpForm.addEventListener("submit", async (event) => await this.insertNewUser(event), {
            signal: this.controller.signal
        }); 
    }

    async insertNewUser(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedEmail = this.email.value.trim();
        const trimmedUserName = this.username.value.trim();
        const trimmedPassword = this.password.value.trim();

        try {
            const { error } = await supabase.auth.signUp({
                email: trimmedEmail,
                password: trimmedPassword,
                options: {
                    data: {
                        username: trimmedUserName
                    },
                    emailRedirectTo: 'http://localhost:5173/html/index.html'
                } 
            });
            
            if (error) throw 'Sign up failed';
            this.signUpMessage.classList.remove('hidden');
            this.signUpMessage.classList.add('block');
            this.signUpMessage.textContent = 'Sign up successful! Check your email for verification.';
        } catch (error: any) {
            this.signUpMessage.classList.remove('hidden');
            this.signUpMessage.classList.add('block');
            this.signUpMessage.textContent = error.message;
        } finally {
            this.showSignUpMessage();
            this.signUpForm.reset();
        }
    }

    showSignUpMessage(): void {
        this.timeout = window.setTimeout(() => this.teardownSignUpMessage(), 3000);
    }

    teardownSignUpMessage(): void {
        this.signUpMessage.classList.remove('block');
        this.signUpMessage.classList.add('hidden');

        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    teardownSignUp(): void {
        this.controller.abort();
        this.signUpForm.reset();
        this.teardownTable();
        this.teardownSignUpMessage();
    }
}

const signUp = new SignUp();
const init = () => signUp.initSignUp();
const teradown = () => signUp.teardownSignUp();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teradown);