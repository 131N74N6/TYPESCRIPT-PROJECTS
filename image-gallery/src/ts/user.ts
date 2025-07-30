import DatabaseStorage from "./supabase-table";
import Modal from "./modal";
import { getSession } from "./supabase-config";
import type { UserGalleryDisplay } from "./custom-types";

class UserGalleryDisplayer extends DatabaseStorage<UserGalleryDisplay> {
    private controller = new AbortController();
    private notificationElement = document.getElementById("personal-gallery-notification") as HTMLElement;
    private makeNotification = new Modal(this.notificationElement);

    private personalImagesGallery = document.getElementById("personal-images-gallery") as HTMLElement;
    private noPostMessage = document.getElementById("no-post-message") as HTMLElement;

    private currentUserId: string | null = null; // Untuk menyimpan ID pengguna yang login

    constructor() {
        super("image_gallery");
    }
    
    async initEventListener(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            this.currentUserId = session.user.id;
            await this.realtimeInit({ 
                callback: (data: UserGalleryDisplay[]) => this.showUserImages(data),
                initialQuery: (query) => query.eq('user_id', this.currentUserId)
            });
        } else {
            // Ini seharusnya tidak terjadi jika auth-guard.ts berfungsi,
            // tetapi sebagai fallback
            this.makeNotification.createComponent("Anda perlu login untuk melihat galeri pribadi.");
            this.makeNotification.showComponent();
            window.location.replace('/html/signin.html');
        }

        // Event listener untuk tombol sign-out sudah dipindahkan ke auth-guard.ts
        // sehingga tidak perlu ada di sini lagi
    }

    // Metode ini akan dipanggil oleh realtimeInit, menerima semua data,
    // lalu memfilter berdasarkan user_id
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
        link.href = `detail.html?id=${detail.id}`; // Arahkan ke halaman detail
        link.className = "block";
        
        const imagePost = document.createElement("div") as HTMLDivElement;
        imagePost.className = "image-post-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300";

        const imageWrap = document.createElement("div") as HTMLDivElement;
        imageWrap.className = "image-wrap w-full aspect-square overflow-hidden rounded-t-lg"; 

        // Judul gambar
        const titleElement = document.createElement("h3") as HTMLHeadingElement;
        titleElement.className = "text-lg font-semibold px-4 pt-2 pb-1 text-gray-800 truncate";
        titleElement.textContent = detail.title || 'Untitled Image'; 

        // Deskripsi (opsional, jika ada di GalleryDisplayer)
        const descriptionElement = document.createElement("p") as HTMLParagraphElement;
        descriptionElement.className = "text-sm text-gray-600 px-4 pb-4 line-clamp-2"; 
        descriptionElement.textContent = detail.title || 'No description available.'; 

        detail.image_url.forEach((image_src: string) => {
            const imageContent = document.createElement("img") as HTMLImageElement;
            imageContent.src = image_src;
            imageContent.alt = detail.title || 'Personal Gallery Image';
            imageContent.className = "w-full h-full object-cover block";
            imageWrap.appendChild(imageContent);
        });

        link.appendChild(imageWrap);
        imagePost.appendChild(link);
        imagePost.appendChild(titleElement);
        imagePost.appendChild(descriptionElement);
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