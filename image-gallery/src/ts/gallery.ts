import DatabaseStorage from "./supabase-table";
import Modal from "./components/modal";
import type { GalleryDisplayer } from "./custom-types";
import { PublicPost } from "./components/user-post";

class ImageGalleryDisplayer extends DatabaseStorage<GalleryDisplayer> {
    private controller = new AbortController();
    private galleryNotification = document.getElementById("gallery-notification") as HTMLElement;
    private makeNotification = new Modal(this.galleryNotification);
    private tableName = "image_gallery";
    private searchImageField = document.getElementById("search-image-field") as HTMLFormElement;
    private searchImage = document.getElementById("search-image") as HTMLInputElement;
    private imagesGallery = document.getElementById("images-gallery") as HTMLElement;

    constructor() {
        super();
    }
    
    async initEventListener(): Promise<void> {
        await this.realtimeInit({ 
            tableName: this.tableName,
            callback: (data: GalleryDisplayer[]) => this.showAllImages(data) 
        });

        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#reset-filter")) this.resetFilter();
        }, { signal: this.controller.signal });

        this.searchImageField.addEventListener("submit", async (event) => await this.handleSearchFilter(event), { 
            signal: this.controller.signal 
        });
    }

    private async handleSearchFilter(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const getAllData = Array.from(this.currentData.values());
        const trimmedValue = this.searchImage.value.trim().toLowerCase();

        if (trimmedValue === "") {
            this.makeNotification.createComponent("Masukkan judul buku yang akan dicari");
            this.makeNotification.showComponent();
            return;
        }

        const filteredData = getAllData.filter(data => data.title.includes(trimmedValue));
        this.showFilteredPost(filteredData);
    }

    showFilteredPost(filtered: GalleryDisplayer[]): void {
        this.imagesGallery.innerHTML = '';
        const filteredFragment = document.createDocumentFragment();

        filtered.forEach(data => filteredFragment.appendChild(PublicPost(data)));
        this.imagesGallery.appendChild(filteredFragment);
    }

    showAllImages(images: GalleryDisplayer[]): void {
        const fragment = document.createDocumentFragment();
        try {    
            if (images.length > 0) {
                images.forEach(image => fragment.appendChild(PublicPost(image)));
                this.imagesGallery.innerHTML = '';
                this.imagesGallery.appendChild(fragment);
            } else {
                this.imagesGallery.innerHTML = '';
                this.imagesGallery.textContent = 'No Image Uploaded';
                this.imagesGallery.classList.add('text-gray-600', 'text-center', 'col-span-full', 'py-8');
            }
        } catch (error: any) {
            this.makeNotification.createComponent(`Error: ${error.message || error}`);
            this.makeNotification.showComponent();
            this.imagesGallery.innerHTML = '';
            this.imagesGallery.textContent = 'No Image Uploaded';
            this.imagesGallery.classList.add('text-red-600', 'text-center', 'col-span-full', 'py-8');
        }
    }

    private resetFilter(): void {
        this.searchImageField.reset();
        this.showAllImages(this.toArray());
    }

    teardownGallery(): void {
        this.controller.abort();
        this.teardownStorage();
        this.makeNotification.teardownComponent();
    }
}

const imageGallery = new ImageGalleryDisplayer();
const init = () => imageGallery.initEventListener();
const teardown = () => imageGallery.teardownGallery();

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);