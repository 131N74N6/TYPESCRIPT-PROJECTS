import DatabaseStorage from "./supabase-table";
import Modal from "./components/modal";
import type { GalleryDetails } from "./custom-types";
import { RemoveFile } from "./supabase-storage";

class GalleryDetail extends DatabaseStorage<GalleryDetails> {
    private controller = new AbortController();
    private urlParams = new URLSearchParams(window.location.search);
    private imageId: string | null;
    private currentIndex = 0;
    private totalSlide = 0;

    private detailPostNotification = document.getElementById("detail-post-notification") as HTMLElement;
    private galleryDetailModal: Modal = new Modal(this.detailPostNotification);
    private storageName = 'gallery';
    private imageTable = "image_gallery";

    private uploaderName = document.querySelector("#uploader-name") as HTMLParagraphElement;
    private carouselContainer = document.querySelector("#carousel-container") as HTMLElement; 
    private navigationContainer = document.querySelector("#navigation") as HTMLElement; 
    private imageTitle = document.querySelector("#image-title") as HTMLParagraphElement;
    private uploadedAt = document.querySelector("#created-at") as HTMLParagraphElement;

    constructor() {
        super();
        this.imageId = this.urlParams.get('id');
    }

    async initEventListener(): Promise<void> {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#left-button")) {
                if (this.totalSlide > 1) { // Hanya geser jika ada lebih dari 1 slide
                    this.prevSlide();
                }
            } else if (target.closest("#right-button")) {
                if (this.totalSlide > 1) { // Hanya geser jika ada lebih dari 1 slide
                    this.nextSlide();
                }
            } else if (target.closest("#delete-button")) {
                if (this.imageId) {
                    this.deletePost(this.imageId);
                }
            }
        }, { signal: this.controller.signal });

        await this.realtimeInit({
            tableName: this.imageTable,
            callback: (images) => this.showGalleryDetail(images),
            initialQuery: (addQuery) => addQuery.eq('id', this.imageId)
        });
    }

    async showGalleryDetail(imageDetail: GalleryDetails[]): Promise<void> {
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
            imageWrap.className = "flex-shrink-0 w-full h-full relative overflow-hidden";

            const imageElement = document.createElement("img") as HTMLImageElement;
            imageElement.className = "w-full h-full object-contain block";
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

        // Tampilkan/sembunyikan navigasi
        this.navigationContainer.style.display = this.totalSlide > 1 ? 'flex' : 'none';

        // Panggil updateCarousel untuk memastikan tampilan awal benar
        this.updateCarousel();
    }

    private displayMessage(message: string): void {
        this.carouselContainer.innerHTML = `<p style="text-align: center; padding: 20px;">${message}</p>`;
        this.imageTitle.textContent = ''; 
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

    teardownPost(): void {
        this.controller.abort();
        this.resetCarouselState();
        this.imageId = null;
        this.teardownStorage();
        this.galleryDetailModal.teardownComponent();
        this.carouselContainer.innerHTML = '';
        this.imageTitle.textContent = '';
        this.uploadedAt.textContent = '';
        this.navigationContainer.style.display = 'none';
    }

    private async deletePost(id: string) {
        try {
            const getImageData = this.currentData.get(id);
            if (!getImageData) return;

            const paths: string[] = getImageData.image_url;
            await Promise.all(paths.map(path => RemoveFile(path, this.storageName)));
            
            await this.deleteData({
                tableName: this.imageTable,
                column: 'id',
                values: id
            }); 
            
            this.carouselContainer.innerHTML = '';
            window.location.replace('/gallery.html');

        } catch (error: any) {
            this.galleryDetailModal.createComponent(`${error.message || error}`);
            this.galleryDetailModal.showComponent();
        }
    }
}

const galleryDetail = new GalleryDetail();
const init = () => galleryDetail.initEventListener();
const teardown = () => galleryDetail.teardownPost();

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);