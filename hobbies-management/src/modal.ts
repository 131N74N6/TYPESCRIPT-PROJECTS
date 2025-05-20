class Modal {
    private notification: HTMLElement;
    private notificationComponent: HTMLDivElement;
    private notificationMessage: HTMLParagraphElement;
    private timeout: number | null = null;

    constructor(notification: HTMLElement) {
        this.notification = notification;
        this.notificationComponent = document.createElement("div");
        this.notificationMessage = document.createElement("p");
        this.showModal();
    }

    createModal(text: string): void {
        this.notificationComponent.className = "content";
        this.notificationMessage.textContent = text;
        this.notificationComponent.appendChild(this.notificationMessage);
        this.notification.appendChild(this.notificationComponent);
    }

    private showModal(): void {
        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    }

    private teardownModal(): void {
        if (this.timeout) clearTimeout(this.timeout);
        this.notificationComponent.remove();
    }
}

export default Modal;