import type { Users } from "./custom-types";
import { supabase } from "./supabase-config";
import DatabaseStorage from "./supabase-table";

class SignUp extends DatabaseStorage<Users> {
    private controller = new AbortController();
    private signUpForm = document.querySelector('#sign-up-form') as HTMLFormElement;
    private username = document.querySelector('#username') as HTMLInputElement;
    private email = document.getElementById('email') as HTMLInputElement;
    private password = document.getElementById('password') as HTMLInputElement;
    private signUpMessage = document.getElementById('message') as HTMLDivElement;

    constructor() {
        super('image_gallery_user');
    }
    
    initSignUp(): void {
        this.signUpForm.addEventListener("submit", async (event) => await this.insertNewUser(event), {
            signal: this.controller.signal
        }); 
    }

    async insertNewUser(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        try {
            const { data, error } = await supabase.auth.signUp({
                email: this.email.value.trim(),
                password: this.password.value.trim(),
                options: {
                    data: {
                        username: this.username.value.trim()
                    }
                }
            });
            
            if (error) throw error;
            this.signUpMessage.textContent = 'Sign up successful! Check your email for verification.';
            await this.saveUserData(data.user);
        } catch (error) {
            this.signUpMessage.textContent = error instanceof Error ? error.message : 'Sign up failed';
        } finally {
            this.signUpForm.reset();
        }
    }

    async saveUserData(userData: any): Promise<void> {
        await this.insertData({
            email: userData.email,
            username: userData.user_metadata.username,
            password: userData.user_metadata.password
        });
    }

    teardownSignUp(): void {
        this.controller.abort();
        this.signUpForm.reset();
        this.teardownStorage();
    }
}

const signUp = new SignUp();
const init = () => signUp.initSignUp();
const teradown = () => signUp.teardownSignUp();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teradown);