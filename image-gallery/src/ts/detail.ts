import DatabaseStorage from "./storage";
import Modal from "./modal";

interface DetailData {
    id: string;
    image_url: string[];
    title: string;
    description?: string; // Tambahkan ini jika ada deskripsi di DB
    created_at: Date;
}

class GalleryDetail extends DatabaseStorage<DetailData> {
    private controller = new AbortController();
    private urlParams = new URLSearchParams(window.location.search);
    private imageId: string | null;

    private notification__: HTMLElement;
    private galleryDetailModal: Modal;
    private imageGroup: HTMLElement; // <section class="image-group">

    // Elemen DOM yang akan kita manipulasi untuk carousel
    private carouselContainer: HTMLElement; // <div class="carousel-container">
    private navigationContainer: HTMLElement; // <div class="navigation">

    private currentIndex = 0;
    private totalSlide = 0;

    constructor() {
        super("image_gallery");
        this.imageId = this.urlParams.get('id');

        const notificationElement = document.getElementById("notification__");
        if (!notificationElement) throw new Error("Element with ID 'notification__' not found.");
        this.notification__ = notificationElement;
        this.galleryDetailModal = new Modal(this.notification__);

        const imageGroupElement = document.querySelector(".image-group");
        if (!imageGroupElement) throw new Error("Element with class 'image-group' not found.");
        this.imageGroup = imageGroupElement as HTMLElement;

        const carouselContainerElement = document.querySelector(".carousel-container");
        if (!carouselContainerElement) throw new Error("Element with class 'carousel-container' not found.");
        this.carouselContainer = carouselContainerElement as HTMLElement;

        const navigationElement = document.querySelector(".navigation");
        if (!navigationElement) throw new Error("Element with class 'navigation' not found.");
        this.navigationContainer = navigationElement as HTMLElement;

        // Memuat data awal saat instance dibuat
        this.realtimeInit((data) => {
            const updatedDetail = data.find(item => item.id === this.imageId);
            if (updatedDetail) {
                this.renderDetail(updatedDetail);
            } else if (!updatedDetail && this.imageId) {
                this.imageGroup.innerHTML = '<p>Gambar ini telah dihapus.</p>';
                this.resetCarouselState();
            }
        });

        if (this.imageId) {
            this.showGalleryDetail(); // Panggil untuk memuat data awal
        } else {
            this.imageGroup.innerHTML = '<p>ID gambar tidak ditemukan di URL.</p>';
            this.navigationContainer.style.display = 'none';
        }
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
            }
        }, { signal: this.controller.signal });
    }

    async showGalleryDetail(): Promise<void> {
        if (!this.imageId) {
            this.imageGroup.innerHTML = '<p>ID gambar tidak ditemukan.</p>';
            this.navigationContainer.style.display = 'none';
            return;
        }

        try {
            const getDetail = await this.selectedData(this.imageId);

            if (getDetail) {
                this.renderDetail(getDetail);
            } else {
                this.imageGroup.innerHTML = '<p>Gambar tidak ditemukan.</p>';
                this.navigationContainer.style.display = 'none';
                this.resetCarouselState();
            }
        } catch (error: any) {
            console.error("Error fetching gallery detail:", error);
            this.galleryDetailModal.createComponent(`Gagal memuat detail gambar: ${error.message || error}`);
            this.galleryDetailModal.showComponent();
            this.imageGroup.innerHTML = '<p>Terjadi kesalahan saat memuat detail gambar.</p>';
            this.navigationContainer.style.display = 'none';
            this.resetCarouselState();
        }
    }

    private renderDetail(detail: DetailData): void {
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


        // Perbarui detail info di HTML yang sudah ada
        const titleElement = this.imageGroup.querySelector('.detail-info h2') as HTMLHeadingElement;
        const descriptionElement = this.imageGroup.querySelector('.detail-info .description') as HTMLParagraphElement;
        const createdAtElement = this.imageGroup.querySelector('.detail-info .created-at') as HTMLElement;

        if (titleElement) titleElement.textContent = detail.title;
        if (descriptionElement) descriptionElement.textContent = detail.description || 'Tidak ada deskripsi.';
        if (createdAtElement) createdAtElement.textContent = `Diunggah pada: ${detail.created_at.toLocaleString()}`;

        // Perbarui totalSlide dan reset currentIndex
        this.totalSlide = detail.image_url.length;
        this.currentIndex = 0;

        // Tampilkan/sembunyikan navigasi jika diperlukan
        this.navigationContainer.style.display = this.totalSlide > 1 ? 'flex' : 'none'; // Tampilkan hanya jika ada lebih dari 1 gambar

        // Panggil updateCarousel untuk memastikan tampilan awal benar
        this.updateCarousel();
    }

    updateCarousel(): void {
        if (!this.carouselContainer || this.totalSlide === 0) {
            return;
        }

        if (this.currentIndex < 0) {
            this.currentIndex = this.totalSlide - 1;
        } else if (this.currentIndex >= this.totalSlide) {
            this.currentIndex = 0;
        }

        // Terapkan transform pada carouselContainer itu sendiri
        // Karena setiap gambar adalah flex item 100%, kita geser 100% dari lebar container
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
        this.imageGroup.innerHTML = '';
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