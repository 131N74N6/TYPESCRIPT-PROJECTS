type Carousel = {
    currentIndex: number;
    totalSlide: number;
    updateCarousel: () => void;
    prevSlide: () => void;
    nextSlide: () => void;
}

const images1 = document.querySelectorAll(".image-1");
const carouselContainer1 = document.querySelector(".carousel-container-1") as HTMLElement;

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
        console.log(this.currentIndex);
        this.currentIndex++;
        this.updateCarousel();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const leftBtn1 = document.querySelector(".left-btn-1") as HTMLButtonElement;
    const rightBtn1 = document.querySelector(".right-btn-1") as HTMLButtonElement;

    if (leftBtn1) leftBtn1.addEventListener("click", (): void => firstCarousel.prevSlide());
    if (rightBtn1) rightBtn1.addEventListener("click", (): void => firstCarousel.nextSlide());

});