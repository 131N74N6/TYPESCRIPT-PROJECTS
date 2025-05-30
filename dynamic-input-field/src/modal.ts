class Modal {
    private modalMessage: HTMLElement;
    private modal = document.createElement("div");
    private text = document.createElement("p") as HTMLParagraphElement;
    private timeout: number | null = null;

    constructor(modalMessage: HTMLElement) {
        this.modalMessage = modalMessage;
        this.modal.className = "modal";
        this.showModal();
    }

    public createModalComponent(message: string): void {
        this.text.textContent = message;
        this.modal.appendChild(this.text);
        this.modalMessage.appendChild(this.modal);
    }

    public showModal(): void {
        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    }

    public teardownModal(): void {
        if (this.modal.parentElement) {
            this.modal.parentElement.removeChild(this.modal);
        }

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        this.modalMessage.innerHTML = '';
        this.text.textContent = '';
    }
}

export default Modal;