import { supabase } from "./supabase-config";
import SupabaseTable from "./supabase-table";
import type { Users } from "./custom-types";

class SignIn extends SupabaseTable<Users> {
    private controller = new AbortController();
    private signInField = document.getElementById('sign-in-field') as HTMLFormElement;
    private email = document.getElementById('email') as HTMLInputElement;
    private password = document.getElementById('password') as HTMLInputElement;
    private signInMessage = document.getElementById('message') as HTMLDivElement;
    private timeout: number | null = null;
    private noteUserTable = 'note_user';

    constructor() {
        super();
    }

    initSignIn(): void {
        this.signInField.addEventListener('submit', async (event) => this.verifySavedUser(event), {
            signal: this.controller.signal
        });
    }

    async verifySavedUser(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedEmail = this.email.value.trim();
        const trimmedPassword = this.password.value.trim();

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password: trimmedPassword
            });

            if (error) throw error;

            const user = data.user;

            if (user) {
                let userProfile: Users | null = null;
                try {
                    const { data: existingProfile, error: selectError } = await supabase
                    .from('note_user')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                    
                    if (selectError && selectError.code !== 'PGRST116') throw selectError;

                    userProfile = existingProfile;

                } catch (selectError: any) {
                    console.error("Error checking existing user profile:", selectError.message);
                }

                if (!userProfile) {
                    const username = user.user_metadata?.username || 'Pengguna Baru';

                    try {
                        await this.upsertData({
                            tableName: this.noteUserTable,
                            dataToUpsert: {
                                id: user.id,
                                email: user.email,
                                username: username,
                                password: this.password.value.trim()
                            }
                        });
                    } catch (error: any) {
                        this.signInMessage.classList.remove('hidden');
                        this.signInMessage.classList.add('block');
                        this.signInMessage.textContent = `Login successful, but failed to save profile: ${error.message}`;
                        this.showSignInMessage();
                        return;
                    }
                }
            }
            
            window.location.replace('/html/home.html');
        } catch (error: any) {
            this.signInMessage.classList.remove('hidden');
            this.signInMessage.classList.add('block');
            this.signInMessage.textContent = error;
        } finally {
            this.showSignInMessage();
            this.signInField.reset();
        }
    }

    showSignInMessage(): void {
        this.timeout = window.setTimeout(() => this.teardownSignInMessage(), 3000);
    }

    teardownSignInMessage(): void {
        this.signInMessage.classList.remove('block');
        this.signInMessage.classList.add('hidden');

        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    teardownSignIn(): void {
        this.controller.abort();
        this.signInField.reset();
        this.teardownTable();
        this.teardownSignInMessage();
    }
}

const signIn = new SignIn();
const init = () => signIn.initSignIn();
const teardown = () => signIn.teardownSignIn();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown)