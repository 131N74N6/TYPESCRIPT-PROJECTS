import DatabaseStorage from "./storage";

interface ImageMedia {
    id: string;
    image_url: string[];
}

class ImageGallery extends DatabaseStorage<ImageMedia> {
    private searchImageField = document.getElementById("search-image-field") as HTMLFormElement;
    private searchImage = document.getElementById("search-image") as HTMLInputElement;
    private imagesGallery = document.getElementById("images-gallery") as HTMLElement;

    constructor() {
        super("image_gallery");
        this.realtimeInit(() => this.showAllImages());
    }

    initEventListener(): void {}

    showAllImages(): void {}

    createComponent(detail: ImageMedia): HTMLDivElement {
        const div = document.createElement("div") as HTMLDivElement;

        return div;
    }
}

const imageGallery = new ImageGallery();

function initGallery(): void {
    imageGallery.initEventListener();
}

function teardownGallery(): void {
    imageGallery.teardownStorage();
}

document.addEventListener("DOMContentLoaded", initGallery);
window.addEventListener("beforeunload", teardownGallery);