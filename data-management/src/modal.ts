const modalMsg = document.getElementById("modal-msg") as HTMLElement;

class Modal {
    private message: string;
    private modal: HTMLDivElement;

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
    }

    public showModal(): void {
        modalMsg.appendChild(this.modal);
        setTimeout(() => this.modal.remove(), 3000);
    }
}

export default Modal;