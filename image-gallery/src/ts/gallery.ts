import DatabaseStorage from "./storage";
import Modal from "./modal";

interface ImageMedia {
    id: string;
    title: string;
    image_url: string[];
}

class ImageGalleryDisplayer extends DatabaseStorage<ImageMedia> {
    private controller = new AbortController();
    private galleryNotification = document.getElementById("gallery-notification") as HTMLElement;
    private makeNotification = new Modal(this.galleryNotification);

    private searchImageField = document.getElementById("search-image-field") as HTMLFormElement;
    private searchImage = document.getElementById("search-image") as HTMLInputElement;
    private imagesGallery = document.getElementById("images-gallery") as HTMLElement;

    constructor() {
        super("image_gallery");
        this.realtimeInit(() => this.showAllImages());
    }

    initEventListener(): void {
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

    showFilteredPost(filtered: ImageMedia[]): void {
        this.imagesGallery.innerHTML = '';
        const filteredFragment = document.createDocumentFragment();

        filtered.forEach(data => filteredFragment.appendChild(this.createComponent(data)));
        this.imagesGallery.appendChild(filteredFragment);
    }

    showAllImages(): void {
        const data = Array.from(this.currentData.values());
        const fragment = document.createDocumentFragment();
        if (data.length > 0) {
            data.forEach(dt => fragment.appendChild(this.createComponent(dt)));
            this.imagesGallery.innerHTML = '';
            this.imagesGallery.appendChild(fragment);
        } else {
            this.imagesGallery.innerHTML = '';
            this.imagesGallery.textContent = 'No Image Uploaded';
        }
    }

    private createComponent(detail: ImageMedia): HTMLDivElement {
        const link = document.createElement("a") as HTMLAnchorElement;
        link.href = `detail.html?id=${detail.id}`;
        
        const imagePost = document.createElement("div") as HTMLDivElement;
        imagePost.className = "image-post";

        const imageWrap = document.createElement("div") as HTMLDivElement;
        imageWrap.className = "image-wrap";

        detail.image_url.forEach((image_src) => {
            const imageContent = document.createElement("img") as HTMLImageElement;
            imageContent.src = image_src;
            imageWrap.appendChild(imageContent);
        });

        link.append(imageWrap);
        imagePost.append(link);
        return imagePost;
    }

    private resetFilter(): void {
        this.searchImageField.reset();
        this.showAllImages();
    }

    teardown(): void {
        this.controller.abort();
    }
}

const imageGallery = new ImageGalleryDisplayer();

function initGallery(): void {
    imageGallery.initEventListener();
}

function teardownGallery(): void {
    imageGallery.teardownStorage();
    imageGallery.teardown();
}

document.addEventListener("DOMContentLoaded", initGallery);
window.addEventListener("beforeunload", teardownGallery);