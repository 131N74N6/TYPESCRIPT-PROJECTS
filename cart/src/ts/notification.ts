const content = document.createElement('div') as HTMLDivElement;
const text = document.createElement('div') as HTMLDivElement
let timeout: number | null = null;

export default function Modal(notification: HTMLElement) {
    return {
        createNotification(message: string): void {
            content.className = 'component';
            text.textContent = message;
            content.appendChild(text);
            notification.appendChild(content);
        },

        showNotivication(): void {
            timeout = window.setTimeout(() => this.teardownNotivication(), 3000);
        },

        teardownNotivication(): void {
            if (content.parentElement) {
                content.parentElement.removeChild(content);
            }
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            notification.innerHTML = '';
        }
    }
}