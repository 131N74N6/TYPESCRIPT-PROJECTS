type Carousel = {
    currentIndex: number;
    totalSlide: number;
    intervalId?: number | null;
    updateCarousel: () => void;
    prevSlide: () => void;
    nextSlide: () => void;
    startAutoSlide?: () => void;
    stopAutoSlide?: () => void;
}

const images1 = document.querySelectorAll(".image-1");
const carouselContainer1 = document.querySelector(".carousel-container-1") as HTMLElement;

const images2 = document.querySelectorAll(".image-2");
const carouselContainer2 = document.querySelector(".carousel-container-2") as HTMLElement;

const images3 = document.querySelectorAll(".image-3");
const carouselContainer3 = document.querySelector(".carousel-container-3") as HTMLElement;

const firstCarousel: Carousel = {
    currentIndex: 0,
    totalSlide: images1.length,

    updateCarousel() {
        if (this.currentIndex < 0) this.currentIndex = this.totalSlide - 1;
        if (this.currentIndex >= this.totalSlide) this.currentIndex = 0;
        
        carouselContainer1.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    },

    prevSlide() {
        this.currentIndex--;
        this.updateCarousel();
    },

    nextSlide() {
        this.currentIndex++;
        this.updateCarousel();
    }
}

const secondCarousel: Carousel = {
    currentIndex: 0,
    totalSlide: images2.length,
    intervalId: null,

    updateCarousel() {
        if (this.currentIndex < 0) this.currentIndex = this.totalSlide - 1;
        if (this.currentIndex >= this.totalSlide) this.currentIndex = 0;

        carouselContainer2.style.transform = `translateY(-${this.currentIndex * 100}%)`;
    },

    nextSlide() {
        this.currentIndex++;
        this.updateCarousel();
    },

    prevSlide() {
        this.currentIndex--;
        this.updateCarousel();
    },

    startAutoSlide(): void {
        this.intervalId = setInterval(() => {
            this.nextSlide();
        }, 3000);
    },

    stopAutoSlide() {
        if (this.intervalId) clearInterval(this.intervalId);
    }
}

const thirdCarousel: Carousel = {
    currentIndex: 0,
    totalSlide: images3.length,
    intervalId: null,

    updateCarousel() {
        if (this.currentIndex < 0) this.currentIndex = this.totalSlide - 1;
        if (this.currentIndex >= this.totalSlide) this.currentIndex = 0;

        carouselContainer3.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    },

    nextSlide() {
        this.currentIndex++;
        this.updateCarousel();
    },

    prevSlide() {
        this.currentIndex--;
        this.updateCarousel();
    },

    startAutoSlide(): void {
        this.intervalId = setInterval(() => {
            this.nextSlide();
        }, 3000);
    },

    stopAutoSlide() {
        if (this.intervalId) clearInterval(this.intervalId);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (secondCarousel.startAutoSlide) secondCarousel.startAutoSlide();
    if (thirdCarousel.startAutoSlide) thirdCarousel.startAutoSlide();

    if (secondCarousel.startAutoSlide) carouselContainer2.addEventListener("mouseleave", (): void => {
        if (secondCarousel.startAutoSlide) secondCarousel.startAutoSlide();
    });

    if (thirdCarousel.startAutoSlide) carouselContainer3.addEventListener("mouseleave", (): void => {
        if (thirdCarousel.startAutoSlide) thirdCarousel.startAutoSlide();
    });

    if (secondCarousel.startAutoSlide) carouselContainer2.addEventListener("mouseenter", (): void => {
        if (secondCarousel.stopAutoSlide) secondCarousel.stopAutoSlide();
    });

    if (thirdCarousel.startAutoSlide) carouselContainer3.addEventListener("mouseenter", (): void => {
        if (thirdCarousel.stopAutoSlide) thirdCarousel.stopAutoSlide();
    });
    
    const leftBtn1 = document.querySelector(".left-btn-1") as HTMLButtonElement;
    const rightBtn1 = document.querySelector(".right-btn-1") as HTMLButtonElement;

    const leftBtn2 = document.querySelector(".left-btn-2") as HTMLButtonElement;
    const rightBtn2 = document.querySelector(".right-btn-2") as HTMLButtonElement;

    const leftBtn3 = document.querySelector(".left-btn-3") as HTMLButtonElement;
    const rightBtn3 = document.querySelector(".right-btn-3") as HTMLButtonElement;

    if (leftBtn1) leftBtn1.addEventListener("click", (): void => firstCarousel.prevSlide());
    if (rightBtn1) rightBtn1.addEventListener("click", (): void => firstCarousel.nextSlide());

    if (leftBtn2) leftBtn2.addEventListener("click", (): void => secondCarousel.prevSlide());
    if (rightBtn2) rightBtn2.addEventListener("click", (): void => secondCarousel.nextSlide());

    if (leftBtn3) leftBtn3.addEventListener("click", (): void => thirdCarousel.prevSlide());
    if (rightBtn3) rightBtn3.addEventListener("click", (): void => thirdCarousel.nextSlide());
});