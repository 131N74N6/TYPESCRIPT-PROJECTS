import { supabase } from "./supabase-config";
import TableStorage from "./supabase-table";
import type { Users } from "./custom-types";

const tableStorage = TableStorage<Users>('finance_list_user');

function SignIn() {
    return {
        controller: new AbortController() as AbortController,
        signInField: document.getElementById('sign-in-field') as HTMLFormElement,
        email: document.getElementById('email') as HTMLInputElement,
        password: document.getElementById('password') as HTMLInputElement,
        signInMessage: document.getElementById('message') as HTMLDivElement,
        timeout: null as number | null,

        initSignIn(): void {
            this.signInField.addEventListener('submit', async (event) => this.verifySavedUser(event), {
                signal: this.controller.signal
            });
        },

        async verifySavedUser(event: SubmitEvent): Promise<void> {
            event.preventDefault();
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: this.email.value.trim(),
                    password: this.password.value.trim()
                });

                if (error) throw error;

                const user = data.user;

                if (user) {
                    // **Tahap Baru: Pastikan Profil Pengguna Tersimpan di image_gallery_user**
                    // 1. Coba baca profil pengguna berdasarkan ID mereka
                    let userProfile: Users | null = null;
                    try {
                        const { data: existingProfile, error: selectError } = await supabase
                        .from('image_gallery_user')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                        
                        // PGRST116 is "no rows found"
                        if (selectError && selectError.code !== 'PGRST116') throw selectError;

                        userProfile = existingProfile;

                    } catch (selectError: any) {
                        console.error("Error checking existing user profile:", selectError.message);
                    }

                    if (!userProfile) {
                        // Ambil username dari user_metadata yang disimpan saat sign-up
                        const username = user.user_metadata?.username || 'Pengguna Baru'; 

                        try {
                            tableStorage.upsertData({
                                id: user.id,
                                email: user.email,
                                username: username,
                                password: this.password.value.trim()
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

                setTimeout(() => window.location.href = '/html/home.html', 500);
            } catch (error: any) {
                this.signInMessage.classList.remove('hidden');
                this.signInMessage.classList.add('block');
                this.signInMessage.textContent = error;
            } finally {
                this.showSignInMessage();
                this.signInField.reset();
            }
        },

        showSignInMessage(): void {
            this.timeout = window.setTimeout(() => this.teardownSignInMessage(), 3000);
        },

        teardownSignInMessage(): void {
            this.signInMessage.classList.remove('block');
            this.signInMessage.classList.add('hidden');

            if (this.timeout !== null) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
        },

        teardownSignIn(): void {
            this.controller.abort();
            this.signInField.reset();
            tableStorage.teardownStorage();
            this.teardownSignInMessage();
        }
    }
}

const signIn = SignIn();
const init = () => signIn.initSignIn();
const teardown = () => signIn.teardownSignIn();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown)