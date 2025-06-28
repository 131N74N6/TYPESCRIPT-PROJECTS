import type { Users } from "./custom-types";
import supabase from "./supabase-config";
import DatabaseStorage from "./supabase-table";

class SignUp extends DatabaseStorage<Users> {
    private signUpField = document.getElementById('sign-up-filed') as HTMLFormElement;
    private username = document.getElementById('username') as HTMLInputElement;
    private email = document.getElementById('email') as HTMLInputElement;
    private password = document.getElementById('password') as HTMLInputElement;
    private signUpMessage = document.getElementById('message') as HTMLDivElement;

    constructor() {
        super('image_gallery_user');
    }
    
    initSignUp() {
        this.signUpField.onsubmit = async (event) => await this.signUp(event);
    }

    async signUp(event: SubmitEvent) {
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
            this.signUpField.reset();
        }
    }

    async saveUserData(userData: any) {
        await this.addToDatabase({
            created_at: new Date(),
            email: userData.email,
            username: userData.username,
            password: userData.password,
        });
    }
}

const signUp = new SignUp();

document.addEventListener('DOMContentLoaded', signUp.initSignUp);
window.addEventListener('beforeunload', signUp.teardownStorage);