class ErrorMessage {
    private errorNotification: HTMLElement;

    constructor(errorNotification: HTMLElement) {
        this.errorNotification = errorNotification;
    }

    createAndshowError(text: string) {
        const message = document.createElement("div");
        message.className = "message";
        message.textContent = text;
        this.errorNotification.appendChild(message);
    }
}

export default ErrorMessage;