const modal = document.getElementById("modal") as HTMLElement;

class Modal {
    private message: string;
    private modalComponent: HTMLDivElement;
    private timeout: number | null = null

    constructor(message: string) {
        this.message = message;
        this.modalComponent = document.createElement("div");
        this.createModalComponent();
        this.showModal();
    }

    createModalComponent(): void {
        this.modalComponent.className = "notification";
        const p: HTMLParagraphElement = document.createElement("p");
        p.textContent = this.message;
        p.className = "message";
        this.modalComponent.appendChild(p);
        modal.appendChild(this.modalComponent);
    }

    showModal(): void {
        this.timeout = setTimeout(() => this.teardownModal(), 3000);
    }

    private teardownModal(): void {
        if (this.timeout) clearTimeout(this.timeout);
        this.modalComponent.remove()
    }
}

export default Modal