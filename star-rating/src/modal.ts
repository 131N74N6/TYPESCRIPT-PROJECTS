class Modal {
    private notification = document.getElementById("notification") as HTMLElement;
    private content = document.createElement("div") as HTMLDivElement;
    private p = document.createElement("p") as HTMLParagraphElement;
    private message: string;
    private timeout: number | null = null;

    constructor(message: string) {
        this.message = message;
        this.createModalComponent();
        this.showModal();
    }

    createModalComponent(): void {
        this.p.textContent = this.message;
        this.p.className = "message";
        this.content.className = "content";
        this.content.appendChild(this.p);
        this.notification.appendChild(this.content);
    }

    showModal(): void {
        this.timeout = setTimeout(() => this.teardownModal(), 3000);
    }

    teardownModal(): void {
        if (this.timeout) clearTimeout(this.timeout);
        this.content.remove();
    }
}

export default Modal;