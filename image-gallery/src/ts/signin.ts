import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase-config";
import DatabaseStorage from "./supabase-table";

class SignIn extends DatabaseStorage<User> {
    private controller = new AbortController();
    private signInField = document.getElementById('sign-in-field') as HTMLFormElement;
    private email = document.getElementById('email') as HTMLInputElement;
    private password = document.getElementById('password') as HTMLInputElement;

    constructor() {
        super('image_gallery_user');
    }

    initSignIn(): void {
        this.signInField.addEventListener('submit', async (event) => this.verifySavedUser(event), {
            signal: this.controller.signal
        });
    }

    async verifySavedUser(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        const { data, error } = await supabase.auth.signInWithPassword({
            email: this.email.value.trim(),
            password: this.password.value.trim()
        });

        if (error) throw error;

        await this.selectedData(data.user.id);

        setTimeout(() => window.location.href = '/html/user.html', 500);
    }

    teardownSignIn(): void {
        this.signInField.reset();
        this.teardownStorage();
    }
}

const signIn = new SignIn();
const init = () => signIn.initSignIn();
const teardown = () => signIn.teardownSignIn();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown)