class Notification {
    component: HTMLElement;
    notificationComponent = document.createElement("div") as HTMLDivElement;
    notificationMessage = document.createElement("p") as HTMLParagraphElement;
    timeout = null as number | null;

    constructor(component: HTMLElement) {
        this.component = component;
    }

    createModal(text: string): void {
        this.notificationComponent.className = "p-[0.5rem] bg-[#8B8C89] text-[1rem] font-mono font-[550]";
        this.notificationMessage.textContent = text;
        this.notificationComponent.appendChild(this.notificationMessage);
        this.component.appendChild(this.notificationComponent);
        this.showModal();
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

        this.notificationComponent.innerHTML = '';
        this.notificationMessage.textContent = '';
    }
}

export default Notification;