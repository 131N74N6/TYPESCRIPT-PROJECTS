export default function Modal(container: HTMLElement) {
    let timeoutId: number | null = null;

    function createModal(message: string, type: 'success' | 'error' = 'success') {
        container.innerHTML = '';
        const modal = document.createElement('div');
        modal.className = `p-4 rounded-lg shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        modal.innerHTML = `
            <div class="flex items-start">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2 mt-0.5"></i>
                <span>${message}</span>
            </div>
        `;
        container.appendChild(modal);
    }

    function showMessage(duration: number = 3000) {
        if (timeoutId) clearTimeout(timeoutId);
        container.classList.remove('hidden');
        timeoutId = setTimeout(() => {
            container.classList.add('hidden');
        }, duration) as unknown as number;
    }

    function teardown() {
        if (timeoutId) clearTimeout(timeoutId);
        container.innerHTML = '';
    }

    return { createModal, showMessage, teardown }
}