const modal = document.getElementById("modal") as HTMLElement;

class Modal {
    private message: string;
    private modalComponent: HTMLDivElement = document.createElement("div");

    constructor(message: string) {
        this.message = message;
        this.createModalComponent();
        this.showModal();
    }

    createModalComponent(): void {
        this.modalComponent.className = "component";
        const p: HTMLParagraphElement = document.createElement("p");
        p.textContent = this.message;
        p.className = "message";
        this.modalComponent.appendChild(p);
    }

    showModal(): void {
        modal.appendChild(this.modalComponent)
        setTimeout(() => this.modalComponent.remove(), 3000);
    }
}

export default Modal