import DatabaseStorage from "./supabase-table";
import Modal from "./modal";
import type { GalleryDisplayer } from "./custom-types";

class ImageGalleryDisplayer extends DatabaseStorage<GalleryDisplayer> {
    private controller = new AbortController();
    private galleryNotification = document.getElementById("gallery-notification") as HTMLElement;
    private makeNotification = new Modal(this.galleryNotification);

    private searchImageField = document.getElementById("search-image-field") as HTMLFormElement;
    private searchImage = document.getElementById("search-image") as HTMLInputElement;
    private imagesGallery = document.getElementById("images-gallery") as HTMLElement;

    constructor() {
        super("image_gallery");
    }
    
    async initEventListener(): Promise<void> {
        await this.realtimeInit({ callback: (data: GalleryDisplayer[]) => this.showAllImages(data) });

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

        filtered.forEach(data => filteredFragment.appendChild(this.createComponent(data)));
        this.imagesGallery.appendChild(filteredFragment);
    }

    showAllImages(images: GalleryDisplayer[]): void {
        const fragment = document.createDocumentFragment();
        try {    
            if (images.length > 0) {
                images.forEach(image => fragment.appendChild(this.createComponent(image)));
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

    private createComponent(detail: GalleryDisplayer): HTMLDivElement {
        const link = document.createElement("a") as HTMLAnchorElement;
        link.href = `detail.html?id=${detail.id}`;
        
        const imagePost = document.createElement("div") as HTMLDivElement;
        imagePost.className = "image-post-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300";

        const imageWrap = document.createElement("div") as HTMLDivElement;
        imageWrap.className = "image-wrap w-full aspect-square overflow-hidden rounded-t-lg";

        detail.image_url.forEach((image_src) => {
            const imageContent = document.createElement("img") as HTMLImageElement;
            imageContent.src = image_src;
            imageContent.className = "w-full h-full object-cover block";
            imageWrap.appendChild(imageContent);
        });

        link.append(imageWrap);
        imagePost.append(link);
        return imagePost;
    }

    private resetFilter(): void {
        this.searchImageField.reset();
        this.showAllImages(this.toArray());
    }

    teardown(): void {
        this.controller.abort();
    }
}

const imageGallery = new ImageGalleryDisplayer();

async function initGallery(): Promise<void> {
    await imageGallery.initEventListener();
}

function teardownGallery(): void {
    imageGallery.teardownStorage();
    imageGallery.teardown();
}

document.addEventListener("DOMContentLoaded", initGallery);
window.addEventListener("beforeunload", teardownGallery);