class Modal {
    private message: HTMLElement;
    private modalComponent = document.createElement("div") as HTMLDivElement;
    private p = document.createElement("p") as HTMLParagraphElement;
    private timeout: number | null  = null;

    constructor(message: HTMLElement) {
        this.message = message;
    }

    createModalComponent(text: string): void {
        this.p.textContent = text;
        this.modalComponent.className = "content";
        this.modalComponent.appendChild(this.p)
        this.message.appendChild(this.modalComponent);
    }

    showModal(): void {
        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    }

    teardownModal(): void {
        if (this.modalComponent.parentElement) {
            this.modalComponent.parentElement.removeChild(this.modalComponent);
        }

        if (this.timeout) {
            clearInterval(this.timeout);
            this.timeout = null;
            this.modalComponent.remove();
        }
    }
}

export default Modal;