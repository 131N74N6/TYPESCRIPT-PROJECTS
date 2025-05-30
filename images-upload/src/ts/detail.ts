import type { Unsubscribe } from "firebase/firestore";
import Storage from "./storage";
import Theme from "./theme";

type ImageDetail = {
    id: string;
    title: string;
    url: string[];
    category: string;
}

let unsubscribe: Unsubscribe | null = null;
const storage = Storage<ImageDetail>("images");
const theme = Theme("dark-theme", "dark-theme");

const urlParams = new URLSearchParams(window.location.search);
const imageId = urlParams.get('id');

const imageTitle = document.getElementById("image-title") as HTMLHeadingElement;
const imageCategory = document.getElementById("image-category") as HTMLParagraphElement;
const carouselWrap = document.getElementById("carousel-wrap") as HTMLElement;

const controller = new AbortController();
const toggleTheme = document.getElementById('dark-mode') as HTMLInputElement;

const ShowImageDetail = () => ({
    currentIndex: 0 as number,
    totalSlide: 0 as number,

    eventListeners(): void {
        if(!imageId) return;

        document.body.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#prev-button")) this.prevSlide();
            if (target.closest("#next-button")) this.nextSlide();
            if (target.closest("#delete-button")) await this.deleteSelectedImage(imageId);
        }, { signal: controller.signal });

        toggleTheme.addEventListener("change", (event) => this.handleThemeToggle(event), { 
            signal: controller.signal 
        });
    },

    updateCarousel(): void {
        if (this.currentIndex < 0) this.currentIndex = this.totalSlide - 1;
        else if (this.currentIndex >= this.totalSlide) this.currentIndex = 0;
        const translatePercentage = this.currentIndex * -100;
        carouselWrap.style.transform = `translateX(${translatePercentage}%)`;
    },

    prevSlide(): void {
        this.currentIndex--;
        this.updateCarousel();
    },

    nextSlide(): void {
        this.currentIndex++;
        this.updateCarousel();
    },

    handleThemeChange: theme.debounce((isChecked: boolean) => {
        theme.changeTheme(isChecked ? 'active' : 'inactive')
        theme.changeSign(isChecked ? 'Daylight Mode' : 'Midnight Mode');
    }, 100),

    handleThemeToggle(event: Event) {
        this.handleThemeChange((event.target as HTMLInputElement).checked);
    },

    async showImageDetail(): Promise<void> {
        if(!imageId) return;

        unsubscribe = storage.realtimeGetSelectedData(imageId, (data) => {
            if (!data) {
                alert("Gambar sudah dihapus atau belum diunggah");
                window.location.href = 'gallery.html';
                return;
            }

            imageTitle.textContent = data.title;
            imageCategory.textContent = `Category: ${data.category}`;

            carouselWrap.innerHTML = '';
            data.url.forEach((url) => {
                const imageWrap = document.createElement("div") as HTMLDivElement;
                imageWrap.className = "image-wrap";

                const htmlImageDisplayer = document.createElement('img') as HTMLImageElement;
                htmlImageDisplayer.src = url;
                htmlImageDisplayer.alt = data.title;

                imageWrap.appendChild(htmlImageDisplayer);
                carouselWrap.appendChild(imageWrap);
            });
            
            this.totalSlide = data.url.length;
            this.currentIndex = 0;
            this.updateCarousel();
        });
    }, 

    async deleteSelectedImage(id: string): Promise<void> {
        await storage.deleteSelectedData(id);
        window.location.href = 'gallery.html';
    }
});

function initDetail(): void {
    ShowImageDetail().showImageDetail();
    ShowImageDetail().eventListeners();
    toggleTheme.checked = theme.isActive;
}

function cleanupDetail(): void {
    controller.abort();
    if(unsubscribe) unsubscribe();
}

document.addEventListener("DOMContentLoaded", initDetail);
window.addEventListener("beforeunload", cleanupDetail);