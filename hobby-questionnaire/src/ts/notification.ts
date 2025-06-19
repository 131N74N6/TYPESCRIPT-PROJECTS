function Notification(element: HTMLElement) {
    let timeout: number | null = null;
    const message = document.createElement('span') as HTMLSpanElement;
    const component = document.createElement('div') as HTMLDivElement;

    function createNotification(text: string): void {
        message.id = 'message';
        message.textContent = text;
        component.id = 'notification-component';
        component.className = '';
        component.appendChild(message);
        element.appendChild(component);
    }

    function showNotification(): void {
        timeout = window.setTimeout(() => teardownNotification(), 3000);
    }

    function teardownNotification(): void {
        if (component.parentElement) {
            component.parentElement.removeChild(component)
        }

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
            component.remove();
        }

        element.innerHTML = '';
    }

    return { createNotification, showNotification, teardownNotification }
}

export default Notification;