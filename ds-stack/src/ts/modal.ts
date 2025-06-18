class Modal {
    private notification: HTMLElement;
    private notificationComponent: HTMLDivElement;
    private notificationMessage: HTMLParagraphElement;
    private timeout: number | null = null;

    constructor(notification: HTMLElement) {
        this.notification = notification;
        this.notificationComponent = document.createElement("div");
        this.notificationMessage = document.createElement("p");
    }

    createModal(text: string): void {
        this.notificationComponent.className = "content";
        this.notificationMessage.textContent = text;
        this.notificationComponent.appendChild(this.notificationMessage);
        this.notification.appendChild(this.notificationComponent);
    }

    showModal(): void {
        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    }

    teardownModal(): void {
        if (this.notificationComponent.parentElement) {
            this.notificationComponent.parentElement.removeChild(this.notificationComponent);
        }
        
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
            this.notificationComponent.remove();
        }

        this.notification.innerHTML = '';
        this.notificationMessage.textContent = '';
    }
}

export default Modal;