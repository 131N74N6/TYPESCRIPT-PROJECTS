import DatabaseStorage from "./supabase-table";
import Modal from "./modal";
import type { GalleryDetails } from "./custom-types";
import { RemoveFile } from "./supabase-storage";

class GalleryDetail extends DatabaseStorage<GalleryDetails> {
    private controller = new AbortController();
    private urlParams = new URLSearchParams(window.location.search);
    private imageId: string | null;
    private currentIndex = 0;
    private totalSlide = 0;

    private notification__ = document.getElementById("notification__") as HTMLElement;
    private galleryDetailModal: Modal = new Modal(this.notification__);
    private storageName = 'gallery';

    private uploaderName = document.querySelector(".uploader-name") as HTMLParagraphElement;
    private carouselContainer = document.querySelector(".carousel-container") as HTMLElement; 
    private navigationContainer = document.querySelector(".navigation") as HTMLElement; 
    private imageTitle = document.querySelector(".image-title") as HTMLParagraphElement;
    private uploadedAt = document.querySelector(".created-at") as HTMLParagraphElement;

    constructor() {
        super("image_gallery");
        this.imageId = this.urlParams.get('id');
        this.realtimeInit(() => this.showGalleryDetail());
    }

    initEventListener(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            // Gunakan closest agar lebih tangguh
            if (target.closest(".left-button")) {
                if (this.totalSlide > 1) { // Hanya geser jika ada lebih dari 1 slide
                    this.prevSlide();
                }
            } else if (target.closest(".right-button")) {
                if (this.totalSlide > 1) { // Hanya geser jika ada lebih dari 1 slide
                    this.nextSlide();
                }
            } else if (target.closest(".delete-button")) {
                if (this.imageId) {
                    this.deletePost(this.imageId);
                }
            }
        }, { signal: this.controller.signal });
    }

    async showGalleryDetail(): Promise<void> {
        // Hapus konten carousel dan info sebelum memuat yang baru
        this.carouselContainer.innerHTML = '';
        this.imageTitle.textContent = '';
        this.uploadedAt.textContent = '';
        this.navigationContainer.style.display = 'none'; // Sembunyikan navigasi secara default

        if (!this.imageId) {
            this.displayMessage('Image not found or has been deleted');
            return;
        }

        try {
            const getDetail = await this.selectedData(this.imageId);

            if (getDetail) {
                this.createSliderComponent(getDetail);
            } else {
                this.displayMessage('Image not found or has been deleted');
                this.resetCarouselState();
            }
        } catch (error: any) {
            console.error("Error fetching gallery detail:", error);
            this.galleryDetailModal.createComponent(`Failed to load image: ${error.message || error}`);
            this.galleryDetailModal.showComponent();
            this.displayMessage('Something went wrong. Please try again later.');
            this.resetCarouselState();
        }
    }

    private createSliderComponent(detail: GalleryDetails): void {
        this.carouselContainer.innerHTML = ''; 

        detail.image_url.forEach((image, index) => {
            const imageWrap = document.createElement("div") as HTMLDivElement;
            imageWrap.className = "image-wrap";

            const imageElement = document.createElement("img") as HTMLImageElement;
            imageElement.className = "images";
            imageElement.src = image;
            imageElement.alt = `${detail.title} - Image ${index + 1}`;

            imageWrap.appendChild(imageElement);
            this.carouselContainer.appendChild(imageWrap);
        });

        this.uploaderName.textContent = detail.uploader_name;
        this.imageTitle.textContent = detail.title;
        this.uploadedAt.textContent = `Uploaded at: ${new Date(detail.created_at).toLocaleString()}`;

        // Perbarui totalSlide dan reset currentIndex
        this.totalSlide = detail.image_url.length;
        this.currentIndex = 0;

        // Tampilkan/sembunyikan navigasi jika diperlukan
        this.navigationContainer.style.display = this.totalSlide > 1 ? 'flex' : 'none'; // Tampilkan hanya jika ada lebih dari 1 gambar

        // Panggil updateCarousel untuk memastikan tampilan awal benar
        this.updateCarousel();
    }

    private displayMessage(message: string): void {
        this.carouselContainer.innerHTML = `<p style="text-align: center; padding: 20px;">${message}</p>`;
        this.imageTitle.textContent = ''; // Kosongkan judul dan tanggal
        this.uploadedAt.textContent = '';
    }

    updateCarousel(): void {
        if (!this.carouselContainer || this.totalSlide === 0) return;

        if (this.currentIndex < 0) {
            this.currentIndex = this.totalSlide - 1;
        } else if (this.currentIndex >= this.totalSlide) {
            this.currentIndex = 0;
        }

        this.carouselContainer.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }

    prevSlide(): void {
        this.currentIndex--;
        this.updateCarousel();
    }

    nextSlide(): void {
        this.currentIndex++;
        this.updateCarousel();
    }

    private resetCarouselState(): void {
        this.currentIndex = 0;
        this.totalSlide = 0;
    }

    teardown(): void {
        this.controller.abort();
        this.resetCarouselState();
        this.galleryDetailModal.teardownComponent();
        this.carouselContainer.innerHTML = ''; // Kosongkan hanya carousel
        this.imageTitle.textContent = '';
        this.uploadedAt.textContent = '';
        this.navigationContainer.style.display = 'none';
    }

    private async deletePost(id: string) {
        try {
            const getImageData = this.currentData.get(id);
            if (!getImageData) return;

            const paths: string[] = getImageData.image_url;
            await this.deleteSelectedData(id); 
            await Promise.all(paths.map(path => RemoveFile(path, this.storageName)));
            
            this.carouselContainer.innerHTML = '';
            setTimeout(() => window.location.href = '/gallery.html', 500);

        } catch (error: any) {
            this.galleryDetailModal.createComponent(`Failed to delete post: ${error.message || error}`);
            this.galleryDetailModal.showComponent();
        }
    }
}

const galleryDetail = new GalleryDetail();

function initGallery(): void {
    galleryDetail.initEventListener();
}

function teardownGallery(): void {
    galleryDetail.teardownStorage();
    galleryDetail.teardown();
}

document.addEventListener("DOMContentLoaded", initGallery);
window.addEventListener("beforeunload", teardownGallery);