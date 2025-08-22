class Modal {
    private notification: HTMLElement;
    private modal: HTMLDivElement;
    private message: HTMLParagraphElement;
    private timeout: null | number;

    constructor(notification: HTMLElement) {
        this.notification = notification;
        this.modal = document.createElement("div") as HTMLDivElement;
        this.message = document.createElement("p") as HTMLParagraphElement;
        this.timeout = null;
    }

    createComponent(text: string) {
        this.modal.className = "modal";

        this.message.className = "this.";
        this.message.textContent = text;

        this.modal.appendChild(this.message);
        this.notification.appendChild(this.modal);

        this.showComponent();
    }

    showComponent(): void {
        this.timeout = window.setTimeout(() => this.teardownComponent(), 3000);
    }

    teardownComponent(): void {
        if (this.modal.parentElement) {
            this.modal.parentElement.removeChild(this.modal);
            this.modal.innerHTML = '';
        }

        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}

export default Modal;