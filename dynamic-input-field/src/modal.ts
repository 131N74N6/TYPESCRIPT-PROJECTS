class Modal {
    private modalMessage: HTMLElement;
    private modal: HTMLDivElement;
    private timeout: number | null = null;

    constructor(modalMessage: HTMLElement) {
        this.modalMessage = modalMessage;
        this.modal = document.createElement("div");
        this.modal.className = "modal";
    }

    public createModalComponent(message: string): void {
        const text = document.createElement("p");
        text.textContent = message;
        this.modal.appendChild(text);
        this.modalMessage.appendChild(this.modal);
        this.showModal();
    }

    public showModal(): void {
        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    }

    private teardownModal(): void {
        if (this.modalMessage.parentElement) {
            this.modalMessage.parentElement.removeChild(this.modalMessage);
        }

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}

export default Modal;