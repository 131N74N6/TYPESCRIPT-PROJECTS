class Modal {
    private message = document.getElementById("message") as HTMLElement;
    private modalComponent = document.createElement("div") as HTMLDivElement;
    private p = document.createElement("p") as HTMLParagraphElement
    private text: string;

    constructor(text: string) {
        this.text = text;
        this.createModalComponent();
    }

    createModalComponent(): void {
        this.p.textContent = this.text;
        this.modalComponent.className = "content";
        this.modalComponent.appendChild(this.p)
        this.message.appendChild(this.modalComponent);
    }

    showModal(): void {
        setTimeout(() => this.modalComponent.remove(), 3000);
    }
}

export default Modal;