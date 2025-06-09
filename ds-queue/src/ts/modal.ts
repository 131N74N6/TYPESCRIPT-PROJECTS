const Modal = (notification: HTMLElement) => ({
    timeout: null as number | null,
    notificationElement: notification as HTMLElement,
    content: document.createElement('div') as HTMLDivElement,
    message: document.createElement('span') as HTMLSpanElement,

    createComponent(text: string): void {
        this.content.className = 'component';
        this.message.textContent = text;
        this.content.appendChild(this.message);
        this.notificationElement.appendChild(this.content);
    },

    showComponent(): void {
        this.timeout = window.setTimeout(() => this.teardownComponent(), 3000);
    },

    teardownComponent(): void {
        if (this.content.parentElement) {
            this.content.parentElement.removeChild(this.content);
        }

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        this.notificationElement.innerHTML = '';
    }
});

export default Modal;