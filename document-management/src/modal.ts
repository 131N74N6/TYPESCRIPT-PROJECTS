const Modal = {
    modal: document.getElementById("modal") as HTMLElement,
    messageWrap: document.createElement("p") as HTMLParagraphElement,
    notification: document.createElement("div") as HTMLDivElement,
    timeout: null as number | null,

    createModal(message: string): void {
        const notification = document.createElement("div") as HTMLDivElement;
        notification.className = "notification";

        this.messageWrap.className = "message";
        this.messageWrap.textContent = message;

        notification.appendChild(this.messageWrap);
        this.modal.appendChild(notification);
    },

    showMessage(): void {
        this.timeout = setTimeout(() => this.teardown(), 3000);
    },

    teardown(): void {
        if (this.modal.parentElement) {
            this.modal.parentElement.removeChild(this.modal);
        }
        
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}

export default Modal;