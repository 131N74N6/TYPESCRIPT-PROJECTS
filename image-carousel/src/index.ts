type Carousel = {
    currentIndex: number;
    totalSlide: number;
    intervalId?: number | null;
    updateCarousel: () => void;
    prevSlide: () => void;
    nextSlide: () => void;
    startAutoSlide?: () => void;
    stopAutoSlide?: () => void;
    abortController?: AbortController;
}

const images1 = document.querySelectorAll(".image-1");
const carouselContainer1 = document.querySelector(".carousel-container-1") as HTMLElement;

const images2 = document.querySelectorAll(".image-2");
const carouselContainer2 = document.querySelector(".carousel-container-2") as HTMLElement;

const images3 = document.querySelectorAll(".image-3");
const carouselContainer3 = document.querySelector(".carousel-container-3") as HTMLElement;

let abortController: AbortController;

const firstCarousel: Carousel = {
    currentIndex: 0,
    totalSlide: images1.length,

    updateCarousel(): void {
        if (this.currentIndex < 0) this.currentIndex = this.totalSlide - 1;
        if (this.currentIndex >= this.totalSlide) this.currentIndex = 0;
        
        carouselContainer1.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    },

    prevSlide(): void {
        this.currentIndex--;
        this.updateCarousel();
    },

    nextSlide(): void {
        this.currentIndex++;
        this.updateCarousel();
    }
}

const secondCarousel: Carousel = {
    currentIndex: 0,
    totalSlide: images2.length,
    intervalId: null,

    updateCarousel(): void {
        if (this.currentIndex < 0) this.currentIndex = this.totalSlide - 1;
        if (this.currentIndex >= this.totalSlide) this.currentIndex = 0;

        carouselContainer2.style.transform = `translateY(-${this.currentIndex * 100}%)`;
    },

    nextSlide(): void {
        this.currentIndex++;
        this.updateCarousel();
    },

    prevSlide(): void {
        this.currentIndex--;
        this.updateCarousel();
    },

    startAutoSlide(): void {
        this.intervalId = setInterval(() => this.nextSlide(), 3000);
    },

    stopAutoSlide(): void {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = null;
    }
}

const thirdCarousel: Carousel = {
    currentIndex: 0,
    totalSlide: images3.length,
    intervalId: null,

    updateCarousel(): void {
        if (this.currentIndex < 0) this.currentIndex = this.totalSlide - 1;
        if (this.currentIndex >= this.totalSlide) this.currentIndex = 0;

        carouselContainer3.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    },

    nextSlide(): void {
        this.currentIndex++;
        this.updateCarousel();
    },

    prevSlide(): void {
        this.currentIndex--;
        this.updateCarousel();
    },

    startAutoSlide(): void {
        this.intervalId = setInterval(() => this.nextSlide(), 3000);
    },

    stopAutoSlide(): void {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = null;
    }
}

function setupEventListeners(): void {
    abortController = new AbortController();
    const { signal } = abortController;

    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;

        if (target.classList.contains("left-btn-1")) firstCarousel.prevSlide();
        if (target.classList.contains("right-btn-1")) firstCarousel.nextSlide();
        if (target.classList.contains("left-btn-2")) secondCarousel.prevSlide();
        if (target.classList.contains("right-btn-2")) secondCarousel.nextSlide();
        if (target.classList.contains("left-btn-3")) thirdCarousel.prevSlide();
        if (target.classList.contains("right-btn-3")) thirdCarousel.nextSlide();
    }, { signal });

    carouselContainer2.addEventListener("mouseenter", (): void => {
        if (secondCarousel.stopAutoSlide) secondCarousel.stopAutoSlide();
    }, { signal });

    carouselContainer2.addEventListener("mouseleave", (): void => {
        if (secondCarousel.startAutoSlide) secondCarousel.startAutoSlide()
    }, { signal });

    carouselContainer3.addEventListener("mouseenter", (): void => {
        if (thirdCarousel.stopAutoSlide) thirdCarousel.stopAutoSlide();
    }, { signal });

    carouselContainer3.addEventListener("mouseleave", (): void => {
        if (thirdCarousel.startAutoSlide) thirdCarousel.startAutoSlide();
    }, { signal });
}

function init(): void {
    setupEventListeners();
}

function teardown(): void {
    abortController.abort();
    secondCarousel.stopAutoSlide?.();
    thirdCarousel.stopAutoSlide?.();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);