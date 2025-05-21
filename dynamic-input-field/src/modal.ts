class Modal {
    private modalMessage: HTMLElement = document.getElementById("modal-msg") as HTMLElement;
    private message: string;
    private modal: HTMLDivElement;
    private timeout: number | null = null;

    constructor(message: string) {
        this.message = message;
        this.modal = document.createElement("div");
        this.modal.className = "modal";
        this.createModalComponent();
        this.showModal();
    }

    public createModalComponent(): void {
        const text = document.createElement("p");
        text.textContent = this.message;
        this.modal.appendChild(text);
        this.modalMessage.appendChild(this.modal);
    }

    public showModal(): void {
        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    }

    private teardownModal(): void {
        if (this.timeout) clearTimeout(this.timeout);
        this.modal.remove()
    }
}

export default Modal;