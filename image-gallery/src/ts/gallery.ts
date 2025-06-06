import DatabaseStorage from "./storage";

interface ImageMedia {
    id: string;
    image_url: string[];
}

class ImageGallery extends DatabaseStorage<ImageMedia> {
    private controller = new AbortController();
    // private searchImageField = document.getElementById("search-image-field") as HTMLFormElement;
    // private searchImage = document.getElementById("search-image") as HTMLInputElement;
    private imagesGallery = document.getElementById("images-gallery") as HTMLElement;

    constructor() {
        super("image_gallery");
        this.realtimeInit(() => this.showAllImages());
    }

    initEventListener(): void {
        // document.addEventListener("click", (event) => {
        //     const target = event.target as HTMLElement;
        // }, { signal: this.controller.signal });
    }

    showAllImages(): void {
        const data = Array.from(this.currentData.values());
        const fragment = document.createDocumentFragment();
        data.forEach(dt => fragment.appendChild(this.createComponent(dt)));
        this.imagesGallery.innerHTML = '';
        this.imagesGallery.appendChild(fragment);
    }

    createComponent(detail: ImageMedia): HTMLDivElement {
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

    teardown(): void {
        this.controller.abort();
    }
}

const imageGallery = new ImageGallery();

function initGallery(): void {
    imageGallery.initEventListener();
}

function teardownGallery(): void {
    imageGallery.teardownStorage();
    imageGallery.teardown();
}

document.addEventListener("DOMContentLoaded", initGallery);
window.addEventListener("beforeunload", teardownGallery);