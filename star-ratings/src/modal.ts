class Modal {
    private notification: HTMLElement;
    private content = document.createElement("div") as HTMLDivElement;
    private p = document.createElement("p") as HTMLParagraphElement;
    private message!: string;
    private timeout: number | null = null;

    constructor(notification: HTMLElement) {
        this.showModal();
        this.notification = notification
    }

    createModalComponent(message: string): void {
        this.message = message;
        this.p.textContent = this.message;
        this.p.className = "message";
        this.content.className = "content";
        this.content.appendChild(this.p);
        this.notification.appendChild(this.content);
    }

    showModal(): void {
        this.content.classList.add("show");
        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    }

    teardownModal(): void {
        this.content.classList.remove("show");
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (this.content.parentElement) {
            this.content.parentElement.removeChild(this.content);
        }

        this.notification.innerHTML = '';
    }
}

export default Modal;