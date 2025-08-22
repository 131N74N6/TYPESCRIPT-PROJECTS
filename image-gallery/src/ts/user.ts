import DatabaseStorage from "./supabase-table";
import Modal from "./components/modal";
import { getSession, supabase } from "./supabase-config";
import type { UserGalleryDisplay } from "./custom-types";
import { UserPost } from "./components/user-post";

class UserGalleryDisplayer extends DatabaseStorage<UserGalleryDisplay> {
    private controller = new AbortController();
    private notificationElement = document.getElementById("personal-gallery-notification") as HTMLElement;
    private makeNotification = new Modal(this.notificationElement);
    private username = document.getElementById("username") as HTMLDivElement;
    private personalImagesGallery = document.getElementById("personal-images-gallery") as HTMLElement;
    private noPostMessage = document.getElementById("no-post-message") as HTMLElement;
    private currentUserId: string | null = null;
    private tableName = "image_gallery";

    constructor() {
        super();
    }
    
    async initEventListener(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            this.currentUserId = session.user.id;
            if (this.currentUserId) await this.displayUsername(this.currentUserId);
            await this.realtimeInit({
                tableName: this.tableName,
                callback: (data: UserGalleryDisplay[]) => this.showUserImages(data),
                initialQuery: (query) => query.eq('user_id', this.currentUserId)
            });
        } else {
            this.makeNotification.createComponent("Please sign-in to see gallery content");
            this.makeNotification.showComponent();
            window.location.replace('/html/signin.html');
        }
    }

    private async displayUsername(userId: string): Promise<void> {
        try {
            const { data, error } = await supabase
            .from('image_gallery_user')
            .select('username')
            .eq('id', userId)
            .single();

            if (error) {
                console.error('Error fetching username:', error.message);
                this.username.textContent = 'Error getting username'; 
                return;
            }

            if (data && data.username) {
                this.username.textContent = `Hello, ${data.username}!`;
            } else {
                this.username.textContent = 'Hello, User!';
            }
        } catch (error: any) {
            console.error('Unexpected error fetching username:', error);
            this.username.textContent = 'Hello, User!'; // Fallback
        }
    }

    showUserImages(allImages: UserGalleryDisplay[]): void {
        this.personalImagesGallery.innerHTML = ''; // Bersihkan konten sebelumnya
        const fragment = document.createDocumentFragment();

        if (!this.currentUserId) {
            this.displayNoPostMessage(true, "Gagal mendapatkan ID pengguna. Harap masuk kembali.");
            return;
        }

        try {    
            if (allImages.length > 0) {
                allImages.forEach(image => fragment.appendChild(UserPost(image)));
                this.personalImagesGallery.appendChild(fragment);
                this.displayNoPostMessage(false); // Sembunyikan pesan jika ada gambar
            } else {
                this.displayNoPostMessage(true, "Tidak ada gambar pribadi yang diunggah.");
            }
        } catch (error: any) {
            this.makeNotification.createComponent(`Error: ${error.message || error}`);
            this.makeNotification.showComponent();
            this.displayNoPostMessage(true, "Terjadi kesalahan saat memuat gambar.");
            console.error(error);
        }
    }


    private displayNoPostMessage(show: boolean, message: string = "Tidak ada gambar pribadi yang diunggah."): void {
        if (show) {
            this.noPostMessage.textContent = message;
            this.noPostMessage.classList.remove('hidden');
        } else {
            this.noPostMessage.classList.add('hidden');
        }
    }

    teardown(): void {
        this.currentUserId = null;
        this.controller.abort();
        this.makeNotification.teardownComponent();
        this.personalImagesGallery.innerHTML = '';
        this.displayNoPostMessage(false);
        this.teardownStorage();
    }
}

const userGallery = new UserGalleryDisplayer();

async function initUserGallery(): Promise<void> {
    await userGallery.initEventListener();
}

function teardownUserGallery(): void {
    userGallery.teardownStorage(); // Asumsi ini ada di DatabaseStorage
    userGallery.teardown();
}

document.addEventListener("DOMContentLoaded", initUserGallery);
window.addEventListener("beforeunload", teardownUserGallery);