const Modal = (modal: HTMLElement) => ({
    modalComponent: document.createElement("div") as HTMLDivElement,
    text: document.createElement("p") as HTMLParagraphElement,
    timeout: null as number | null,

    createModalComponent(message: string): void {
        this.modalComponent.className = "notification";
        this.text.textContent = message;
        this.text.className = "message";
        this.modalComponent.appendChild(this.text);
        modal.appendChild(this.modalComponent);
    },

    showModal(): void {
        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    },

    teardownModal(): void {
        if (this.modalComponent.parentElement) {
            this.modalComponent.parentElement.removeChild(this.modalComponent);
        }

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.modalComponent.remove()
    }
});

export default Modal