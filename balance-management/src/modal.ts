const Modal = (component: HTMLElement) => ({
    notificationComponent: document.createElement("div") as HTMLDivElement,
    notificationMessage: document.createElement("p") as HTMLParagraphElement,
    timeout: null as number | null,

    createModal(text: string): void {
        this.notificationComponent.className = "content";
        this.notificationMessage.textContent = text;
        this.notificationComponent.appendChild(this.notificationMessage);
        component.appendChild(this.notificationComponent);
        this.showModal();
    },

    showModal(): void {
        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    },

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
});

export default Modal;