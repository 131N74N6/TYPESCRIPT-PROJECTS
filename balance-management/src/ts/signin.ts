import { supabase } from "./supabase-config";
import DatabaseStorage from "./supabase-table";
import type { Users } from "./custom-types";

class SignIn extends DatabaseStorage<Users> {
    private controller = new AbortController();
    private signInField = document.getElementById('sign-in-field') as HTMLFormElement;
    private email = document.getElementById('email') as HTMLInputElement;
    private password = document.getElementById('password') as HTMLInputElement;
    private signInMessage = document.getElementById('message') as HTMLDivElement;
    private timeout: number | null = null;

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
                    // Gunakan selectedData yang sudah ada untuk memeriksa keberadaan profil
                    // Kita perlu memastikan selectedData bisa menangani "tidak ditemukan" tanpa melempar error
                    // Atau gunakan kueri langsung yang lebih fleksibel
                    const { data: existingProfile, error: selectError } = await supabase
                        .from('image_gallery_user')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    
                    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "no rows found"
                        throw selectError;
                    }
                    userProfile = existingProfile;

                } catch (selectError: any) {
                    console.error("Error checking existing user profile:", selectError.message);
                    // Lanjutkan eksekusi, mungkin profil belum ada, akan di-upsert nanti
                }

                // 2. Jika profil belum ada, buat (upsert)
                if (!userProfile) {
                    // Ambil username dari user_metadata yang disimpan saat sign-up
                    const username = user.user_metadata?.username || 'Pengguna Baru'; 

                    try {
                        const newProfile = await this.upsertData({
                            id: user.id,
                            email: user.email,
                            username: username,
                            password: this.password.value.trim()
                        });
                        console.log("User profile created/updated:", newProfile);
                    } catch (error: any) {
                        console.error("Error creating/updating user profile:", error.message);
                        // Tampilkan pesan error ke pengguna jika gagal menyimpan profil
                        this.signInMessage.classList.remove('hidden');
                        this.signInMessage.classList.add('block');
                        this.signInMessage.textContent = `Login successful, but failed to save profile: ${error.message}`;
                        this.showSignInMessage();
                        return;
                    }
                }
            }

            await this.selectedData(data.user.id);

            setTimeout(() => window.location.href = '/html/user.html', 500);
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
        this.teardownStorage();
        this.teardownSignInMessage();
    }
}

const signIn = new SignIn();
const init = () => signIn.initSignIn();
const teardown = () => signIn.teardownSignIn();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown)