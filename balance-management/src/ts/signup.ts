import type { Users } from "./custom-types";
import { supabase } from "./supabase-config";
import TableStorage from "./supabase-table";

const tableStorage = TableStorage<Users>('finance_list_user')

function SignUp() {
    return {
        controller: new AbortController(),
        signUpForm: document.querySelector('#sign-up-form') as HTMLFormElement,
        username: document.querySelector('#username') as HTMLInputElement,
        email: document.getElementById('email') as HTMLInputElement,
        password: document.getElementById('password') as HTMLInputElement,
        signUpMessage: document.getElementById('message') as HTMLDivElement,
        timeout: null as null | number,
        
        initSignUp(): void {
            this.signUpForm.addEventListener("submit", async (event) => await this.insertNewUser(event), {
                signal: this.controller.signal
            }); 
        },

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
                        emailRedirectTo: 'http://localhost:5173/html/signin.html'
                    } 
                });
                
                if (error) throw 'Sign up failed';
                this.signUpMessage.classList.remove('hidden');
                this.signUpMessage.classList.add('block');
                this.signUpMessage.textContent = 'Sign up successful! Check your email for verification.';
            } catch (error: any) {
                this.signUpMessage.classList.remove('hidden');
                this.signUpMessage.classList.add('block');
                this.signUpMessage.textContent = error;
            } finally {
                this.showSignUpMessage();
                this.signUpForm.reset();
            }
        },

        showSignUpMessage(): void {
            this.timeout = window.setTimeout(() => this.teardownSignUpMessage(), 3000);
        },

        teardownSignUpMessage(): void {
            this.signUpMessage.classList.remove('block');
            this.signUpMessage.classList.add('hidden');

            if (this.timeout !== null) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
        },

        teardownSignUp(): void {
            this.controller.abort();
            this.signUpForm.reset();
            tableStorage.teardownStorage();
            this.teardownSignUpMessage();
        }
    }
}

const signUp = SignUp();
const init = () => signUp.initSignUp();
const teradown = () => signUp.teardownSignUp();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teradown);