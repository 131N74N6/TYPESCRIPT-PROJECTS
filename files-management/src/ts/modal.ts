function Modal(modal: HTMLElement) {
    let messageWrap = document.createElement("p") as HTMLParagraphElement;
    let notification = document.createElement("div") as HTMLDivElement;
    let timeout: number | null = null;

    function createModal(message: string): void {
        notification.className = "p-[0.45rem]";

        messageWrap.className = "text-[#FFFFFF] font-[550] text-[0.9rem]";
        messageWrap.textContent = message;

        notification.appendChild(messageWrap);
        modal.appendChild(notification);
        showMessage();
    }

    function showMessage(): void {
        notification.classList.add("show");
        timeout = window.setTimeout(() => teardown(), 3000);
    }

    function teardown(): void {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
        
        if (timeout) {
            notification.classList.remove("show");
            clearTimeout(timeout);
            timeout = null;
        }

        notification.innerHTML = '';
        messageWrap.textContent = '';
    }

    return { createModal, showMessage, teardown }
}

export default Modal;