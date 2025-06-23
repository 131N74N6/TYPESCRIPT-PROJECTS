const content = document.createElement('div') as HTMLDivElement;
const text = document.createElement('div') as HTMLDivElement
let timeout: number | null = null;

export default function Modal(notification: HTMLElement) {
    return {
        createNotification(message: string): void {
            content.className = 'm-[1rem] bg-[#7B4B94] text-[1rem] text-[#C4FFB2] font-[500] p-[0.5rem] border-[1.8px] border-[#C4FFB2]';
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