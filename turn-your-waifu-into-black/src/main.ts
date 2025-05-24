import './style.css';

const controller = new AbortController();
const inputField = document.getElementById("input-field") as HTMLFormElement;
const imageUrlLink = document.getElementById("image-url") as HTMLInputElement;
const result = document.getElementById("result") as HTMLDivElement;
const notifictation = document.getElementById("notifictation") as HTMLElement;

const wrapper = document.createElement("div") as HTMLDivElement;
const message = document.createElement("p") as HTMLParagraphElement;

let timeout: number | null = null;

function setupEventListener() {
    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;

        if (target.closest("#clear-all")) resetForm();
    }, { signal: controller.signal });

    inputField.addEventListener("submit", async (event) => await sendImage(event), { 
        signal: controller.signal 
    });
}

async function sendImage(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (!imageUrlLink.value.trim()) {
        createNotification("Please provide image URL");
        showNotification();
        return;
    }

    try {
        const apiUrl = new URL(`https://api.ferdev.my.id/maker/tohitam?link=${imageUrlLink.value}`);
        const response = await fetch(apiUrl.toString());
        
        if (!response.ok) throw new Error(`Something went wrong or check your internet connection.`);

        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        
        result.innerHTML = `<img src="${imageUrl}" alt="result">`;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error occurred. Try again later.";
        createNotification(message);
        showNotification();
    }
}

function resetForm(): void {
    inputField.reset();
    result.innerHTML = '';
}

function createNotification(text: string): void {
    wrapper.className = "notification-content";

    message.className = "message";
    message.textContent = text;

    wrapper.appendChild(message);
    notifictation.appendChild(wrapper);
    showNotification();
}

function showNotification(): void {
    timeout = window.setTimeout(() => teardownNotification(), 3000);
}

function teardownNotification(): void {
    if (wrapper.parentElement) wrapper.parentElement.removeChild(wrapper);

    if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
    }
}

function init(): void {
    setupEventListener();
}

function teardown(): void {
    controller.abort();
    resetForm();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);