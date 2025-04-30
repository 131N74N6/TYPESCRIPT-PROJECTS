class Modal {
    private text: string;
    private notification = document.getElementById("notification") as HTMLElement;
    private notificationComponent: HTMLDivElement;
    private notificationMessage: HTMLParagraphElement;

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
    }

    protected showModal(): void {
        setTimeout(() => this.notification.remove(), 3000);
    }
}

export default Modal;