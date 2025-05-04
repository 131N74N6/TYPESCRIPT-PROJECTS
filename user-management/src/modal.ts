class Modal {
    private text: string;
    private notification = document.getElementById("notification") as HTMLElement;
    private notificationComponent: HTMLDivElement;
    private notificationMessage: HTMLParagraphElement;
    private timeout: number | null = null;

    constructor(text: string) {
        this.text = text;
        this.notificationComponent = document.createElement("div");
        this.notificationMessage = document.createElement("p");
        this.createModal();
        this.showModal();
    }

    protected createModal(): void {
        this.notificationComponent.className = "content";
        this.notificationMessage.textContent = this.text;
        this.notificationComponent.appendChild(this.notificationMessage);
        this.notification.appendChild(this.notificationComponent);
    }

    protected showModal(): void {
        this.timeout = setTimeout(() => this.teardownModal(), 3000);
    }

    private teardownModal(): void {
        if (this.timeout) clearTimeout(this.timeout);
        this.notificationComponent.remove();
    }
}

export default Modal;