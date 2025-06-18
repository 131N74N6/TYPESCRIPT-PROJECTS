import './style.css';

const inputFields = document.getElementById("input-fields") as HTMLFormElement;
const words = document.getElementById("words") as HTMLInputElement;
const result = document.getElementById("result") as HTMLElement;
const resetButton = document.getElementById("reset-button") as HTMLButtonElement;
let controller: AbortController = new AbortController();

function setUpListeners(): void {
    inputFields.addEventListener("submit", (event) => transformString(event), {
        signal: controller.signal
    });
    resetButton.addEventListener("click", resetResult, { signal: controller.signal });
}

function transformString(event: SubmitEvent): void {
    event.preventDefault();
    const getString = words.value.trim().toLowerCase();
    
    const sum = getString.split("")
    .map(char => {
        const code = char.charCodeAt(0);
        if (code >= 97 && code <= 122) return code - 96; // a-z
        if (!isNaN(parseInt(char))) return parseInt(char); // 0-9
        return 0;
    })
    .reduce((a, b) => a + b, 0);

    result.textContent = sum.toString().split("").reverse().join("");
    inputFields.reset();
}

function resetResult(): void {
    result.textContent = "Kamu belum memasukkan kata apapun...";
    inputFields.reset();
}

function init(): void {
    resetResult();
    setUpListeners();
}

function teardown(): void {
    controller.abort();
    result.textContent = "Kamu belum memasukkan kata apapun...";
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);