const Modal = (modal: HTMLElement) => ({
    messageWrap: document.createElement("p") as HTMLParagraphElement,
    notification: document.createElement("div") as HTMLDivElement,
    timeout: null as number | null,

    createModal(message: string): void {
        this.notification.className = "notification";

        this.messageWrap.className = "message";
        this.messageWrap.textContent = message;

        this.notification.appendChild(this.messageWrap);
        modal.appendChild(this.notification);
        this.showMessage();
    },

    showMessage(): void {
        this.notification.classList.add("show");
        this.timeout = window.setTimeout(() => this.teardown(), 3000);
    },

    teardown(): void {
        if (this.notification.parentElement) {
            this.notification.parentElement.removeChild(this.notification);
        }
        
        if (this.timeout) {
            this.notification.classList.remove("show");
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        this.notification.innerHTML = '';
        this.messageWrap.textContent = '';
    }
});

export default Modal;