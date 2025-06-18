class Modal {
    private modalElement: HTMLElement;
    private component = document.createElement("div") as HTMLDivElement;
    private message = document.createElement("p") as HTMLParagraphElement;
    private timeout: number | null = null;

    constructor(modalElement: HTMLElement) {
        this.modalElement = modalElement
    }

    create(text: string): void {
        this.component.className = "modal-component";
        this.message.className = "modal-message";
        this.message.textContent = text;
        this.component.appendChild(this.message);
        this.modalElement.appendChild(this.component);
    }

    show(): void {
        this.timeout = window.setTimeout(() => this.teardown(), 3000);
    }

    teardown(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.modalElement.removeChild(this.component);
        this.component.innerHTML = "";
    }
}

export default Modal;