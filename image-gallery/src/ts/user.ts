import DatabaseStorage from "./supabase-table";
import Modal from "./modal";
import { getSession, supabase } from "./supabase-config";
import type { UserGalleryDisplay } from "./custom-types";

class UserGalleryDisplayer extends DatabaseStorage<UserGalleryDisplay> {
    private controller = new AbortController();
    private notificationElement = document.getElementById("personal-gallery-notification") as HTMLElement;
    private makeNotification = new Modal(this.notificationElement);
    private username = document.getElementById("username") as HTMLDivElement;
    private personalImagesGallery = document.getElementById("personal-images-gallery") as HTMLElement;
    private noPostMessage = document.getElementById("no-post-message") as HTMLElement;
    private currentUserId: string | null = null; 

    constructor() {
        super("image_gallery");
    }
    
    async initEventListener(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            this.currentUserId = session.user.id;
            await this.displayUsername(this.currentUserId);
            await this.realtimeInit({ 
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

        // Filter gambar berdasarkan user_id
        const userImages = allImages.filter(image => image.user_id === this.currentUserId);

        try {    
            if (userImages.length > 0) {
                userImages.forEach(image => fragment.appendChild(this.createComponent(image)));
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

    private createComponent(detail: UserGalleryDisplay): HTMLDivElement {
        const link = document.createElement("a") as HTMLAnchorElement;
        link.href = `detail-user-only.html?id=${detail.id}`; 
        link.className = "block";
        
        const imagePost = document.createElement("div") as HTMLDivElement;
        imagePost.className = "image-post-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300";

        const imageWrap = document.createElement("div") as HTMLDivElement;
        imageWrap.className = "image-wrap w-full aspect-square overflow-hidden rounded-t-lg"; 

        detail.image_url.forEach((image_src: string) => {
            const imageContent = document.createElement("img") as HTMLImageElement;
            imageContent.src = image_src;
            imageContent.className = "w-full h-full object-cover block";
            imageWrap.appendChild(imageContent);
        });

        link.appendChild(imageWrap);
        imagePost.appendChild(link);
        return imagePost;
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